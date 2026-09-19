import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import ambientTrack from './assets/rift-warden-ambient-v070.wav'
import { Laboratory } from './components/game/Laboratory'
import { Hud } from './components/hud/Hud'
import { AIWorklog } from './components/ui/AIWorklog'
import { PortalRegistry } from './components/ui/PortalRegistry'
import { PortalControlPanel } from './components/portal/PortalControlPanel'
import { EventLogPanel } from './components/ui/EventLogPanel'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { SystemReportPanel } from './components/ui/SystemReportPanel'
import { HowToPlay } from './components/ui/HowToPlay'
import { ShiftResult } from './components/ui/ShiftResult'
import { EventChanges } from './components/ui/EventChanges'
import { Modal } from './components/ui/Modal'
import { useModalFocus } from './hooks/useModalFocus'
import { useSimulationClock } from './hooks/useSimulationClock'
import { performAction, type ActionResult } from './domain/actions/applyAction'
import {
  advanceSimulation,
  finishShift,
  restartShift,
  type GameState,
  type GamePhase,
} from './domain/simulation/runtime'
import { calculateLabReport } from './domain/report/calculateLabReport'
import type { PortalAction } from './domain/validation/validateAction'
import { actionLabel, type Language } from './i18n/translations'
import { bi } from './i18n/gameplay'
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
type ActivePanel =
  'event-log' | 'system' | 'settings' | 'registry' | 'worklog' | 'help' | null
function initialVolume() {
  const stored = readPreference('rift-warden-volume'),
    parsed = stored === null ? 0.32 : Number(stored)
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.32
}
function App() {
  const [game, setGame] = useState<GameState>(() => loadLabState() ?? restartShift())
  const snapshot = useRef(game)
  const portals = game.portals,
    events = game.events
  const [language, setLanguage] = useState<Language>(loadLanguage)
  const [onboardingSeen, setOnboardingSeen] = useState(
    () => readPreference('rift-warden-onboarding-seen') === 'yes',
  )
  const [nearbyPortalId, setNearbyPortalId] = useState<string | null>(null)
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(() =>
    readPreference('rift-warden-onboarding-seen') === 'yes' ? null : 'help',
  )
  const [volume, setVolume] = useState(initialVolume)
  const [musicEnabled, setMusicEnabled] = useState(
    () => readPreference('rift-warden-music') !== 'off',
  )
  const [lastAction, setLastAction] = useState<AuditEvent | null>(null)
  const [resetRequested, setResetRequested] = useState(false)
  const [timeScale, setTimeScale] = useState(1)
  const [sceneEpoch, setSceneEpoch] = useState(0)
  const [hidden, setHidden] = useState(() => document.hidden)
  const actionLock = useRef(0),
    audioRef = useRef<HTMLAudioElement | null>(null)
  const storageIssue = useSyncExternalStore(subscribeStorageIssue, getStorageIssue)
  const selectedPortal = portals.find((p) => p.id === selectedPortalId) ?? null
  const ended = game.phase === 'GAME_OVER' || game.phase === 'SHIFT_COMPLETE'
  const blocking =
    selectedPortal !== null || activePanel !== null || resetRequested || ended
  const phase: GamePhase = ended
    ? game.phase
    : activePanel !== null || resetRequested || hidden
      ? 'PAUSED'
      : 'RUNNING'
  const report = useMemo(() => calculateLabReport(portals, events), [portals, events])
  const updateGame = (next: GameState) => {
    snapshot.current = next
    setGame(next)
    const newest = next.events.at(-1)
    if (newest && newest.id !== game.events.at(-1)?.id) setLastAction(newest)
  }
  useSimulationClock(phase, (elapsed) =>
    updateGame(advanceSimulation(snapshot.current, elapsed, Date.now(), timeScale)),
  )
  useEffect(() => {
    saveLabState(portals, events, game)
  }, [game, portals, events])
  useEffect(() => {
    saveLanguage(language)
    document.documentElement.lang = language
  }, [language])
  useEffect(() => {
    const change = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  useEffect(() => {
    writePreference('rift-warden-volume', String(volume))
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])
  useEffect(() => {
    writePreference('rift-warden-music', musicEnabled ? 'on' : 'off')
    const audio = audioRef.current
    if (!audio) return
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
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (resetRequested) {
        setResetRequested(false)
        return
      }
      if (activePanel === 'help' && !onboardingSeen) return
      setSelectedPortalId(null)
      setActivePanel(null)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [resetRequested, activePanel, onboardingSeen])
  const openPortal = (id: string) => {
    if (resetRequested || ended) return
    setActivePanel(null)
    setSelectedPortalId(id)
  }
  const openPanel = (panel: Exclude<ActivePanel, null>) => {
    if (resetRequested) return
    setSelectedPortalId(null)
    setActivePanel(panel)
  }
  const handleAction = (action: PortalAction, confirmed = false): ActionResult => {
    const current = snapshot.current.portals.find((p) => p.id === selectedPortalId)
    if (
      !current ||
      current.id !== nearbyPortalId ||
      ended ||
      performance.now() < actionLock.current
    )
      return { kind: 'busy' }
    const result = performAction(current, action, confirmed, snapshot.current.portals)
    if (!('event' in result)) return result
    actionLock.current = performance.now() + 700
    const next = finishShift({
      ...snapshot.current,
      portals: snapshot.current.portals.map((p) =>
        p.id === current.id ? result.portal : p,
      ),
      events: [...snapshot.current.events, result.event, ...result.systemEvents],
    })
    updateGame(next)
    setLastAction(result.event)
    if (next.phase === 'GAME_OVER' || next.phase === 'SHIFT_COMPLETE') {
      setSelectedPortalId(null)
      setActivePanel(null)
    }
    return result
  }
  const restart = () => {
    clearLabState()
    updateGame(restartShift())
    setLastAction(null)
    setSelectedPortalId(null)
    setActivePanel(null)
    setResetRequested(false)
    setTimeScale(1)
    actionLock.current = 0
    setSceneEpoch((n) => n + 1)
  }
  const empty = () => {
    updateGame({ ...snapshot.current, portals: [], phase: 'RUNNING' })
    setLastAction(null)
    setSelectedPortalId(null)
    setActivePanel(null)
  }
  const start = () => {
    writePreference('rift-warden-onboarding-seen', 'yes')
    setOnboardingSeen(true)
    setActivePanel(null)
  }
  useModalFocus(
    resetRequested
      ? 'restart-confirmation'
      : (selectedPortalId ?? activePanel ?? (ended ? 'shift-result' : null)),
  )
  return (
    <div className="app-shell" data-game-phase={phase}>
      <audio ref={audioRef} src={ambientTrack} loop preload="none" />
      {storageIssue && (
        <div role="alert" className="storage-warning">
          <span>
            {storageIssue === 'invalid'
              ? bi(
                  language,
                  'Сохранение повреждено. Загружена начальная смена.',
                  'Saved data was invalid. Initial shift restored.',
                )
              : bi(
                  language,
                  'Браузер не разрешил сохранить данные. Изменения могут пропасть после перезагрузки.',
                  'Browser storage is unavailable. Changes may be lost on reload.',
                )}
          </span>
          <button className="ops-button" onClick={dismissStorageIssue}>
            OK
          </button>
        </div>
      )}
      <Laboratory
        key={sceneEpoch}
        portals={portals}
        lastAction={lastAction}
        interactionLocked={blocking}
        movementLocked={activePanel !== null || resetRequested || ended}
        onNearbyChange={setNearbyPortalId}
        language={language}
        onSelectPortal={openPortal}
      >
        <Hud
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          portals={portals}
          language={language}
          onLanguageChange={setLanguage}
          onOpenEventLog={() => openPanel('event-log')}
          onOpenSystem={() => openPanel('system')}
          onOpenSettings={() => openPanel('settings')}
          musicEnabled={musicEnabled}
          onToggleMusic={() => setMusicEnabled((v) => !v)}
          onOpenRegistry={() => openPanel('registry')}
          onOpenWorklog={() => openPanel('worklog')}
          onOpenHelp={() => openPanel('help')}
          latestEventId={lastAction?.id}
        />
      </Laboratory>
      {phase === 'PAUSED' && (
        <div className="simulation-paused">
          {bi(language, 'Ⅱ ИГРА НА ПАУЗЕ', 'Ⅱ GAME PAUSED')}
        </div>
      )}
      {selectedPortal && !ended && (
        <PortalControlPanel
          key={selectedPortal.id}
          portal={selectedPortal}
          canInteract={selectedPortal.id === nearbyPortalId}
          network={portals}
          events={events.filter((e) => e.portalId === selectedPortal.id)}
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
          onClear={() => updateGame({ ...snapshot.current, events: [] })}
          allowClear={false}
        />
      )}
      {activePanel === 'system' && !resetRequested && (
        <SystemReportPanel
          report={report}
          portals={portals}
          language={language}
          onClose={() => setActivePanel(null)}
          onLoadEmptyScenario={empty}
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
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'worklog' && (
        <AIWorklog language={language} onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'help' && (
        <HowToPlay
          language={language}
          first={!onboardingSeen}
          onStart={start}
          onClose={() => setActivePanel(null)}
        />
      )}
      {ended && !activePanel && !resetRequested && (
        <ShiftResult
          game={game}
          language={language}
          onRestart={() => setResetRequested(true)}
          onLog={() => openPanel('event-log')}
        />
      )}
      {resetRequested && (
        <Modal
          title={bi(language, 'Начать смену заново?', 'Restart the shift?')}
          eyebrow="RIFT // WARDEN"
          language={language}
          onClose={() => setResetRequested(false)}
        >
          <p>
            {bi(
              language,
              'Текущий прогресс будет потерян. Порталы вернутся в исходное состояние, журнал очистится, смотритель вернётся в центр. Язык, звук, обучение и настройки доступности сохранятся.',
              'Current progress will be lost. Portals return to their initial state, the journal clears and the warden returns to the center. Language, audio, onboarding and accessibility preferences remain.',
            )}
          </p>
          <div className="confirmation-box">
            <button onClick={() => setResetRequested(false)}>
              {bi(language, 'ОТМЕНА', 'CANCEL')}
            </button>
            <button onClick={restart}>
              {bi(language, 'НАЧАТЬ ЗАНОВО', 'RESTART SHIFT')}
            </button>
          </div>
        </Modal>
      )}
      {lastAction && !ended && (
        <div
          key={lastAction.id}
          className={'world-toast world-toast--' + lastAction.status}
          role="status"
        >
          <strong>{lastAction.portalName}</strong>
          <span>{actionLabel(language, lastAction.action)}</span>
          <EventChanges event={lastAction} language={language} />
        </div>
      )}
    </div>
  )
}
export default App
