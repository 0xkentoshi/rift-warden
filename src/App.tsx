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
import { applyAction } from './domain/actions/applyAction'
import { createAuditEvent } from './domain/events/createAuditEvent'
import { calculateLabReport } from './domain/report/calculateLabReport'
import { calculateRisk } from './domain/risk/calculateRisk'
import type { ActionReasonCode, PortalAction } from './domain/validation/validateAction'
import { type Language } from './i18n/translations'
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
      if (event.key !== 'Escape') {
        return
      }

      setSelectedPortalId(null)
      setActivePanel(null)
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const openPortal = (portalId: string) => {
    setActivePanel(null)
    setSelectedPortalId(portalId)
  }

  const openPanel = (panel: Exclude<ActivePanel, null>) => {
    setSelectedPortalId(null)
    setActivePanel(panel)
  }

  const handleAction = (action: PortalAction) => {
    if (!selectedPortal) {
      return
    }

    const beforeRisk = calculateRisk(selectedPortal).score
    const updatedPortal =
      action === 'observe' ? selectedPortal : applyAction(selectedPortal, action)
    const afterRisk = calculateRisk(updatedPortal).score

    if (action !== 'observe') {
      setPortals((current) =>
        current.map((portal) =>
          portal.id === selectedPortal.id ? updatedPortal : portal,
        ),
      )
    }

    setEvents((current) => [
      ...current,
      createAuditEvent(selectedPortal, action, beforeRisk, afterRisk, {
        creatureCount: selectedPortal.creatures,
      }),
    ])
  }

  const handleRejectedAction = (action: PortalAction, reasonCode: ActionReasonCode) => {
    if (!selectedPortal) {
      return
    }

    const risk = calculateRisk(selectedPortal).score

    setEvents((current) => [
      ...current,
      createAuditEvent(selectedPortal, action, risk, risk, {
        status: 'rejected',
        reasonCode,
        creatureCount: selectedPortal.creatures,
      }),
    ])
  }

  const restoreDemo = () => {
    setPortals(initialPortals)
    setEvents([])
    setSelectedPortalId(null)
    setActivePanel(null)
  }

  const loadEmptyScenario = () => {
    setPortals([])
    setSelectedPortalId(null)
    setActivePanel(null)
  }

  const resetLaboratory = () => {
    clearLabState()
    restoreDemo()
  }

  const interactionLocked = selectedPortal !== null || activePanel !== null
  useModalFocus(selectedPortalId ?? activePanel)

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
        portals={portals}
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
          onRejectedAction={handleRejectedAction}
        />
      )}

      {activePanel === 'event-log' && (
        <EventLogPanel
          events={events}
          language={language}
          onClose={() => setActivePanel(null)}
          onClear={() => setEvents([])}
        />
      )}

      {activePanel === 'system' && (
        <SystemReportPanel
          report={report}
          portals={portals}
          onSelectPortal={openPortal}
          language={language}
          onClose={() => setActivePanel(null)}
          onLoadEmptyScenario={loadEmptyScenario}
          onRestoreDemo={restoreDemo}
        />
      )}

      {activePanel === 'settings' && (
        <SettingsPanel
          language={language}
          musicEnabled={musicEnabled}
          volume={volume}
          onMusicEnabledChange={setMusicEnabled}
          onVolumeChange={setVolume}
          onReset={resetLaboratory}
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
    </div>
  )
}

export default App
