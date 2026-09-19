# Gameplay patch — изменённые файлы

База сравнения: опубликованный main 71002aa. Фон, sprite atlas, movement/collision и геометрия остаются неизменными.

- `src/App.tsx`
- `src/components/game/Laboratory.tsx`
- `src/components/game/PortalEntity.tsx`
- `src/components/game/SceneEffects.tsx`
- `src/components/hud/Hud.tsx`
- `src/components/portal/ActionPreviewDetails.tsx`
- `src/components/portal/PortalControlPanel.tsx`
- `src/components/ui/AIWorklog.tsx`
- `src/components/ui/EventChanges.tsx`
- `src/components/ui/EventLogPanel.tsx`
- `src/components/ui/HowToPlay.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/PortalRegistry.tsx`
- `src/components/ui/SettingsPanel.tsx`
- `src/components/ui/ShiftResult.tsx`
- `src/components/ui/SystemReportPanel.tsx`
- `src/data/portals.ts`
- `src/domain/actions/applyAction.ts`
- `src/domain/report/calculateLabReport.ts`
- `src/domain/report/recommendation.ts`
- `src/domain/risk/calculateRisk.ts`
- `src/domain/simulation/network.ts`
- `src/domain/simulation/observer.ts`
- `src/domain/simulation/runtime.ts`
- `src/domain/validation/validateAction.ts`
- `src/game/effects.ts`
- `src/hooks/useSimulationClock.ts`
- `src/i18n/gameplay.ts`
- `src/i18n/translations.ts`
- `src/main.tsx`
- `src/storage/labStorage.ts`
- `src/styles/gameplay.css`
- `src/tests/actionTransaction.test.ts`
- `src/tests/actionValidation.test.ts`
- `src/tests/app.test.tsx`
- `src/tests/auditRendering.test.tsx`
- `src/tests/gameplay.test.ts`
- `src/tests/labReport.test.ts`
- `src/tests/riskEngine.test.ts`
- `src/tests/scene.test.ts`
- `src/tests/storage.test.ts`
- `src/types/audit.ts`
- `src/types/portal.ts`

Также: README.md, docs/requirements.md, docs/qa-checklist.md, docs/qa-history-v3.md, docs/gameplay-audit.md, docs/changed-files.md и tools/serve-qa.mjs (локальный QA, не production).
