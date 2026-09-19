# Final gameplay patch — QA

Проверял Codex через тесты и браузерные взаимодействия; это не заявление о ручном прохождении автором проекта. Проверка gameplay проведена 19 сентября 2026; итоговая упаковка — 20 сентября. Старые проверки сохранены отдельно в [qa-history-v3.md](qa-history-v3.md).

## AUTOMATED TESTS

- `npm test`: **126 тестов / 13 файлов**.
- `npm run lint`: без ошибок и предупреждений.
- `npm run build`: TypeScript и production Vite build.
- Прежние проверки intrinsic risk, запрета наблюдателя, creature warning, закрытого портала, реестра, отчёта, ошибок хранения, движения, collision, stairs и proximity сохранены.
- Новые: Intel/cost/cap/full research; единый preview/commit; независимый и ограниченный network pressure; self-exclusion; карантин, cooldown, reactivate; Safe/Force Close.
- Clock: активное время, pause/resume без catch-up, 2 минуты в каждой основной панели, preview, скрытая вкладка, reload.
- Collapse: один переход/удар, живучесть безопасной сети, каскад опасной сети, отсутствие повторного Game Over, одинаковые большие и малые временные шаги.
- End states: карантин и пустая лаборатория не побеждают, реальные research totals, остановка времени, restart с сохранением preferences.
- Storage v3: roundtrip, v2 migration без перезаписи старого ключа, numeric/lifecycle/phase/audit validation, дубликаты ID.
- Audit rendering: только реальные изменения, причина отказа + текущий риск, Intel/energy отдельно, подтверждённое принудительное закрытие.
- Регрессия найденной в браузере ошибки: события начала collapse и успешного завершения сохраняют фактический резонанс.

Баланс: fresh seed → исследование по сложности, стабилизация при ограничении наблюдателя → 39 операций, Green 1 экспедиция, Red 8. Исходный resonance 38. Две активные минуты без действий не вызывают схлопывание. Это детерминированная проверка правил, не пользовательский плейтест.

## MANUAL BROWSER QA

Production bundle проверен через отдельный локальный сервер; UI управлялся Codex через браузер. Тестовые сохранения изолированы локальными портами.

| Сценарий | Реальные действия и результат |
|---|---|
| Первое открытие | Видны How to play и Start Shift. После Start открывается обычная сцена. Справка повторно доступна через ?. |
| CRITICAL Observer | Crimson Gate → Send Observer. Отказ, объяснение, история, Current risk 90, без фиктивного 90→90. |
| Preview/commit | Crimson → Stabilize: preview 90→45, энергия 94→79, стабильность 16→46, +15 минут; подтверждение даёт эти же значения. |
| Creature warning | Crimson → Close: видны 3 существа и неполный Intel; Cancel оставляет портал открытым. |
| Safe Close | Azure Intel 100 → Safe Close → Confirm; статус CLOSED, risk 0, запись SAFE CLOSE, обычные действия запрещены. |
| Intel / цена | Mossbound → Observer: preview 70→100 Intel и 47→51 energy; commit применяет оба. В истории отдельное возвращение наблюдателя. |
| Quarantine RU | Void → Изолировать: preview 21→12 resonance в текущей сети, status isolated; после подтверждения observer заблокирован, cooldown 10 активных секунд объяснён. |
| Длительная пауза | Настройки оставлены открытыми более двух минут. Возврат к Void: те же 17:54 и 10 секунд cooldown. Накопленная пауза не списалась. |
| Полный успешный маршрут | Через обычные кнопки исследованы Green, Orange, Purple, Red; Blue исследован в seed, Black уже закрыт. Чередование observer/stabilize, затем closure. Итог SHIFT COMPLETE: 6/6 исследовано, 0/6 collapsed, resonance 0, 2 force closures из-за существ. |
| Опасный маршрут | Отдельный QA fixture: все шесть нестабильны, короткий таймер красного. Countdown/VFX → collapse → shock/cascade → Laboratory Lost. Итог: 2/6 исследовано (seed), 6/6 collapsed, 6 incidents; журнал содержит отдельные системные события. Это ускоренный fixture, не обычный seed. |
| End-state restart | View Incident Log доступен. Restart → Cancel возвращает к финалу. Подтверждённый Restart возвращает 6 порталов, 5 open/1 closed, 1 critical, resonance 38, 0 событий; персонаж в центре. |
| Empty state | System → Load empty-lab scenario: NO ACTIVE PORTALS, нулевые счётчики; Settings → Restart возвращает лабораторию. |
| System Report | Старые счётчики, очередь Crimson/Void/Mirror, новые research/unresolved/quarantine/collapse/forced/system metrics видимы. |
| Worklog | Отдельная панель, 8+ часов как оценка автора, tokens Not counted, этап Gameplay Systems Redesign и разделение ролей. |
| RU / EN и размеры | Осмотрены desktop 1280×900, RU карточка на 390×844, EN Worklog и сцена на 320×740. Панели прокручиваются, управление доступно. |
| Console | В тестовой вкладке не было warn/error в момент проверки. |

## Границы проверки

- Один браузерный движок Codex IAB; не матрица Firefox/Safari/реальных телефонов.
- Все шесть лестниц и interaction points проверяются существующими геометрическими/клавиатурными тестами. Повторный ручной обход каждой лестницы в этом патче не заявляется: карта и движение не менялись.
- Пауза hidden tab, повреждённые saves и точная эквивалентность временных шагов — автоматические проверки, не отдельные ручные эксперименты на телефоне.
- Короткую 1.5-секундную последовательность collapse подтверждает доменный тест; браузером подтверждены countdown, погашенные поля, каскадный журнал и финал. Покадровая запись анимации не делалась.
- Баланс проверен воспроизводимыми сценариями и одним успешным UI-прохождением. Внешнего плейтеста с новыми людьми не было.
- Фон и координаты locked asset не менялись; SHA-256 сверяется при упаковке.

## Воспроизведение аварийного QA

```sh
npm ci
npm run build
node tools/serve-qa.mjs
```

http://127.0.0.1:4185/cascade.html — отдельное локальное сохранение со стрессовыми значениями. /finish.html — состояние перед последним safe close. Они не включаются в production и не заменяют обычное прохождение. Новый порт задаётся QA_PORT; для короткого countdown — QA_COLLAPSE_SECONDS. Fixtures устанавливаются один раз на вкладку; далее работают обычные действия и Restart Shift.
