import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import ambientTrack from './assets/rift-warden-ambient-v070.wav'
import { Laboratory } from './components/game/Laboratory'
import { Hud } from './components/hud/Hud'
import { AIWorklog } from './components/ui/AIWorklog'
import { PortalRegistry } from './components/ui/PortalRegistry'
import { useModalFocus } from './hooks/useModalFocus'
import { PortalControlPanel } from './components/portal/PortalControlPanel'
import { EventLogPanel } from './components/ui/EventLogPanel'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { SystemReportPanel } from './components/ui/SystemReportPanel'
import { initialPortals } from './data/portals'
import { performAction, type ActionResult } from './domain/actions/applyAction'
import { calculateLabReport } from './domain/report/calculateLabReport'
import type { PortalAction } from './domain/validation/validateAction'
import { actionLabel, riskLevelLabel, type Language } from './i18n/translations'
import { getRiskLevel } from './domain/risk/calculateRisk'
import { Modal } from './components/ui/Modal'
import {
  clearLabState,
  loadLabState,
  loadLanguage,
  saveLabState,
  saveLanguage,
  readPreference,
  writePreference,
  getStorageIssue,
  dismissStorageIssue,
  subscribeStorageIssue,
} from './storage/labStorage'
import type { AuditEvent } from './types/audit'
import type { Portal } from './types/portal'

type ActivePanel = 'event-log' | 'system' | 'settings' | 'registry' | 'worklog' | null

function getInitialLabState(): {
  portals: Portal[]
  events: AuditEvent[]
} {
  return (
    loadLabState() ?? {
      portals: initialPortals,
      events: [],
    }
  )
}

function getInitialVolume() {
  const stored = readPreference('rift-warden-volume')
  const parsed = stored === null ? 0.32 : Number(stored)
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.32
}

function getInitialMusicEnabled() {
  return readPreference('rift-warden-music') !== 'off'
}

function App() {
  const [initialState] = useState(getInitialLabState)
  const [portals, setPortals] = useState<Portal[]>(initialState.portals)
  const [events, setEvents] = useState<AuditEvent[]>(initialState.events)
  const [language, setLanguage] = useState<Language>(loadLanguage)
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [volume, setVolume] = useState(getInitialVolume)
  const [musicEnabled, setMusicEnabled] = useState(getInitialMusicEnabled)
  const [lastAction, setLastAction] = useState<AuditEvent | null>(null)
  const [resetRequested, setResetRequested] = useState(false)
  const [sceneEpoch, setSceneEpoch] = useState(0)
  const actionLock = useRef(0)
  const portalSnapshot = useRef(initialState.portals)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const storageIssue = useSyncExternalStore(subscribeStorageIssue, getStorageIssue)

  const selectedPortal = useMemo(
    () => portals.find((portal) => portal.id === selectedPortalId) ?? null,
    [portals, selectedPortalId],
  )

  const report = useMemo(() => calculateLabReport(portals, events), [events, portals])

  useEffect(() => {
    saveLabState(portals, events)
  }, [events, portals])

  useEffect(() => {
    saveLanguage(language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    writePreference('rift-warden-volume', String(volume))
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    writePreference('rift-warden-music', musicEnabled ? 'on' : 'off')

    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = volume

    if (!musicEnabled) {
      audio.pause()
      return
    }

    const tryPlay = () => {
      void audio.play().catch(() => undefined)
    }

    tryPlay()
    window.addEventListener('pointerdown', tryPlay, { once: true })
    window.addEventListener('keydown', tryPlay, { once: true })

    return () => {
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [musicEnabled, volume])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return
      }

      if (resetRequested) {
        setResetRequested(false)
        return
      }
      setSelectedPortalId(null)
      setActivePanel(null)
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [resetRequested])

  const openPortal = (portalId: string) => {
    if (resetRequested) return
    setActivePanel(null)
    setSelectedPortalId(portalId)
  }

  const openPanel = (panel: Exclude<ActivePanel, null>) => {
    if (resetRequested) return
    setSelectedPortalId(null)
    setActivePanel(panel)
  }

  const handleAction = (action: PortalAction, confirmed = false): ActionResult => {
    const current = portalSnapshot.current.find((p) => p.id === selectedPortalId)
    if (!current || performance.now() < actionLock.current) return { kind: 'busy' }
    const result = performAction(current, action, confirmed)
    if (!('event' in result)) return result
    actionLock.current = performance.now() + 700
    portalSnapshot.current = portalSnapshot.current.map((p) =>
      p.id === current.id ? result.portal : p,
    )
    setPortals(portalSnapshot.current)
    setEvents((history) => [...history, result.event])
    setLastAction(result.event)
    return result
  }

  const restoreDemo = () => {
    portalSnapshot.current = initialPortals.map((p) => ({ ...p }))
    setPortals(initialPortals)
    setEvents([])
    setSelectedPortalId(null)
    setActivePanel(null)
    setResetRequested(false)
    setLastAction(null)
    actionLock.current = 0
    setSceneEpoch((epoch) => epoch + 1)
  }

  const loadEmptyScenario = () => {
    portalSnapshot.current = []
    setPortals([])
    setLastAction(null)
    setSelectedPortalId(null)
    setActivePanel(null)
  }

  const resetLaboratory = () => {
    clearLabState()
    restoreDemo()
  }

  const interactionLocked = selectedPortal !== null || activePanel !== null
  useModalFocus(resetRequested ? 'reset-confirmation' : (selectedPortalId ?? activePanel))

  return (
    <div className="app-shell">
      <audio ref={audioRef} src={ambientTrack} loop preload="none" />
      {storageIssue && (
        <div role="alert" className="storage-warning">
          <span>
            {language === 'ru'
              ? storageIssue === 'invalid'
                ? 'Сохранение повреждено. Загружена демо-лаборатория.'
                : 'Браузер не разрешил сохранить данные. Можно продолжить, но изменения могут пропасть после перезагрузки.'
              : storageIssue === 'invalid'
                ? 'Saved data was invalid. Demo laboratory restored.'
                : 'Browser storage is unavailable. You can continue, but changes may be lost on reload.'}
          </span>
          <button
            className="ops-button"
            onClick={() => {
              dismissStorageIssue()
            }}
          >
            OK
          </button>
        </div>
      )}

      <Laboratory
        key={sceneEpoch}
        portals={portals}
        lastAction={lastAction}
        interactionLocked={interactionLocked}
        language={language}
        onSelectPortal={openPortal}
      >
        <Hud
          portals={portals}
          language={language}
          onLanguageChange={setLanguage}
          onOpenEventLog={() => openPanel('event-log')}
          onOpenSystem={() => openPanel('system')}
          onOpenSettings={() => openPanel('settings')}
          musicEnabled={musicEnabled}
          onToggleMusic={() => setMusicEnabled((value) => !value)}
          onOpenRegistry={() => openPanel('registry')}
          onOpenWorklog={() => openPanel('worklog')}
          latestEventId={lastAction?.id}
        />
      </Laboratory>

      {selectedPortal && (
        <PortalControlPanel
          key={selectedPortal.id}
          portal={selectedPortal}
          events={events.filter((event) => event.portalId === selectedPortal.id)}
          language={language}
          onClose={() => setSelectedPortalId(null)}
          onAction={handleAction}
          onLanguageChange={setLanguage}
        />
      )}

      {activePanel === 'event-log' && (
        <EventLogPanel
          events={events}
          latestEventId={lastAction?.id}
          language={language}
          onClose={() => setActivePanel(null)}
          onClear={() => setEvents([])}
        />
      )}

      {activePanel === 'system' && !resetRequested && (
        <SystemReportPanel
          report={report}
          portals={portals}
          onSelectPortal={openPortal}
          language={language}
          onClose={() => setActivePanel(null)}
          onLoadEmptyScenario={loadEmptyScenario}
          onRestoreDemo={() => setResetRequested(true)}
        />
      )}

      {activePanel === 'settings' && !resetRequested && (
        <SettingsPanel
          language={language}
          musicEnabled={musicEnabled}
          volume={volume}
          onMusicEnabledChange={setMusicEnabled}
          onVolumeChange={setVolume}
          onReset={() => setResetRequested(true)}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'registry' && (
        <PortalRegistry
          portals={portals}
          language={language}
          onSelect={openPortal}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'worklog' && (
        <AIWorklog language={language} onClose={() => setActivePanel(null)} />
      )}
      {resetRequested && (
        <Modal
          title={
            language === 'ru' ? 'Восстановить лабораторию?' : 'Restore the laboratory?'
          }
          eyebrow="RIFT // WARDEN"
          language={language}
          onClose={() => setResetRequested(false)}
        >
          <p>
            {language === 'ru'
              ? 'Порталы вернутся в исходное состояние. Журнал очистится, смотритель вернётся в центр. Язык и звук сохранятся.'
              : 'Portals return to their initial state, the journal clears and the warden returns to the center. Language and sound preferences remain.'}
          </p>
          <div className="confirmation-box">
            <button onClick={() => setResetRequested(false)}>
              {language === 'ru' ? 'ОТМЕНА' : 'CANCEL'}
            </button>
            <button onClick={resetLaboratory}>
              {language === 'ru' ? 'ВОССТАНОВИТЬ' : 'RESTORE'}
            </button>
          </div>
        </Modal>
      )}
      {lastAction && (
        <div
          key={lastAction.id}
          className={'world-toast world-toast--' + lastAction.status}
          role="status"
        >
          <strong>
            {lastAction.status === 'success' ? '✦ ' : '! '}
            {lastAction.portalName}
          </strong>
          <span>
            {actionLabel(language, lastAction.action)} · {lastAction.beforeRisk}{' '}
            {riskLevelLabel(language, getRiskLevel(lastAction.beforeRisk))} →{' '}
            {lastAction.afterRisk}{' '}
            {riskLevelLabel(language, getRiskLevel(lastAction.afterRisk))}
          </span>
          <small>
            {language === 'ru'
              ? 'Событие записано в журнал'
              : 'Event recorded in the journal'}
          </small>
        </div>
      )}
    </div>
  )
}

export default App
