# Что изменено в доработке

- `src/data/labLayout.ts`, `src/game/`, `useKeyboardMovement.ts`: единые координаты, подходы, препятствия, движение и зоны E.
- `src/components/game/`, `src/components/hud/Hud.tsx`, `src/index.css`: сцена, спрайт, Canvas-эффекты, живые подписи, HUD и мобильный быстрый доступ.
- `src/assets/laboratory-clean.png`, `warden-walk.png`: очищенный фон и новый персонаж. Происхождение и запросы — в `assets.md`.
- `PortalControlPanel.tsx`, `SystemReportPanel.tsx`, `EventLogPanel.tsx`, `recommendation.ts`: объяснение риска, рекомендация, история, приоритеты, подтверждение закрытия.
- `PortalRegistry.tsx`, `AIWorklog.tsx`, `SettingsPanel.tsx`, `Modal.tsx`, `useModalFocus.ts`: реестр, встроенный Worklog, настройки, работа фокуса.
- `src/storage/labStorage.ts`, `ErrorBoundary.tsx`, `App.tsx`: проверяемое сохранение, восстановление и понятные сообщения об ошибках.
- `src/tests/`: сохранены исходные тесты, добавлены проверки UI, геометрии, клавиатуры, интеракций и хранения.
- `README.md`, `docs/`, конфигурация Vite/Vitest, favicon, workflow Pages: запуск, соответствие ТЗ, QA и воспроизводимая публикация.

Исходные расчёт риска, валидация действий, аудит и сводка сохранены. Архивы старых патчей, бэкапы и неиспользуемые ассеты не входят в публикуемые исходники.
