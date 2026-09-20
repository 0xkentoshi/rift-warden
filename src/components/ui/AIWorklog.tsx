import type { Language } from '../../i18n/translations'
import { Modal } from './Modal'
const stages = [
  [
    'Идея и ТЗ',
    'Выбрал пространственную лабораторию и утвердил художественный референс. Передал исходное ТЗ.',
    'Сопоставил исходный код с требованиями: нашёл отсутствие Worklog, рекомендаций и истории в карточке.',
    'Главное — по тестовому заданию; дизайн помогает выделиться.',
  ],
  [
    'Архитектура',
    'Попросил сохранить рабочую предметную логику.',
    'Выделил геометрию, коллизии и эффекты из React-компонентов; сохранил формулу риска и правила действий.',
    'Не ломать risk engine; единая система координат для всей сцены.',
  ],
  [
    'Арт',
    'Выбрал уютную pixel-art лабораторию, отклонил овал, растяжение и статичную сцену.',
    'ImageGen очистил фон и создал спрайты.',
    'Сохранить композицию; убрать впечатываемые подписи и персонажа, сделать живые порталы.',
  ],
  [
    'Интерфейс',
    'Выбрал уютную pixel-art лабораторию, отклонил овал, растяжение и статичную сцену.',
    'Codex собрал HUD, живые подписи, Canvas-эффекты и реестр поверх принятого арта.',
    'Сохранить композицию; убрать впечатываемые подписи и персонажа, сделать живые порталы.',
  ],
  [
    'Логика и ограничения',
    'Зафиксировал приоритет исходного задания над графикой.',
    'Добавил рекомендации, историю, приоритеты в сводке и обработку проблем сохранения.',
    'Понятная формула, запрещённые действия, предупреждение о существах, журнал всех операций.',
  ],
  [
    'Проверка и сдача',
    'Сообщал о проблемах предыдущих версий; общая длительность тех итераций не учитывается по его просьбе.',
    'Запустил тесты, lint, production build; проверил интерфейс в браузере и подготовил README/QA.',
    'Проверить пустой список, запрет действий, стабилизацию, журнал, движение и все шесть подходов.',
  ],
  [
    'Gameplay polish v3',
    'Уточнил ориентацию нижних порталов, потребовал доступные ступени, принял финальный фон и запретил менять его геометрию.',
    'Зафиксировал SHA-256 ассета; расширил карту движения до ступеней, добавил предпросмотр, защиту повторных действий, подтверждение сброса, VFX и индикаторы существ. Проверил транзакции и UI.',
    'Фон финальный. Дальше только walkable map, collision, proximity, персонаж, VFX, существа, огонь и UI поверх него.',
  ],
  [
    'Живая сцена и pixel UI',
    'Указал на слабую атмосферу, слишком обычные шрифты и остановку на наклонных краях. Попросил полировочный патч, сохранив фон и предметную логику.',
    'Добавил скольжение по касательной, поворот спрайта по фактическому движению, микрошаг, усиленные risk-driven эффекты, огни на существующих свечах и локальный Pixelify Sans. Проверил русские/английские панели и геометрию движения.',
    'Убрать ощущение статичного фона; CRITICAL должен быть на порядок активнее LOW; интерфейс — аккуратная cozy fantasy pixel RPG.',
  ],
  [
    'Читаемость и лаборант',
    'Отклонил нечитаемый шрифт, попросил убрать значки глаз и заменить героя маленьким лаборантом по новому референсу без буквального копирования.',
    'Убрал значки глаз, заменил Pixelify Sans парой Press Start 2P для заголовков и PT Mono для текста/цифр. ImageGen создал оригинального лаборанта; Codex выровнял кадры ходьбы по подошвам и проверил RU/EN и узкий экран.',
    'Сохранить стиль, но сделать буквы и цифры читаемыми; маленький пиксельный работник лаборатории. Фон зафиксирован.',
  ],
  [
    'GAMEPLAY SYSTEMS REDESIGN',
    'Определил направление полноценного gameplay: Intel/Observer risk-reward, Network Resonance, Quarantine, live countdown, Safe/Force Close, Collapse/Cascade, Restart Shift и Pause system.',
    'Расширил domain model и gameplay runtime; добавил Intel, network pressure, states, timer model, persistence и tests.',
    'Не ломать ТЗ: понятная формула, быстрый reviewer path, честный журнал и Worklog. Поверх принятого фона — законченный цикл исследования и сдерживания.',
  ],
  [
    'BALANCE & LIVE SIMULATION',
    'Во время ручного тестирования обнаружил Mark Uncertain без положительного эффекта, слишком выгодный Force Close, статичную Stability, медленную проверку и возможность думать над действиями на паузе. Определил исправления: Caution Protocol, Rift Scars, Stability drift, Time Scale и действия без pause.',
    'Реализовал эти механики и targeted regression tests.',
    'Добавить пользу и цену действий, живой дрейф и Time Scale; не ставить действия портала на паузу.',
  ],
  [
    'REMOTE INSPECTION & FINAL UX',
    'Попросил смотреть характеристики кликом из любой точки, разрешать действия только рядом, сохранить физическое перемещение и актуализировать обучение. Сообщил о финальных input/layout проблемах.',
    'Реализовал read-only remote inspection, proximity-gated actions, обновил How to Play и финальные UX fixes.',
    'Удалённый осмотр, действия рядом; исправить залипание движения и layout без изменения domain logic.',
  ],
]
const stagesEn = [
  [
    'Idea and brief',
    'Chose the spatial laboratory, approved the art reference and supplied the original assignment.',
    'Audited the existing implementation against the brief and identified missing worklog, recommendations and per-portal history.',
    'Follow the assignment first; use design to make the result distinctive.',
  ],
  [
    'Architecture',
    'Requested preservation of existing domain logic.',
    'Separated geometry, collisions and effects from React; preserved the risk formula and action rules.',
    'One scene coordinate system; do not break the risk engine.',
  ],
  [
    'Art',
    'Selected the cozy pixel-art direction and rejected distortion, the center oval and a static scene.',
    'ImageGen cleaned the background and created sprites.',
    'Keep the composition; remove baked UI and character; make portals live.',
  ],
  [
    'Interface',
    'Selected the cozy pixel-art direction and rejected distortion, the center oval and a static scene.',
    'Codex implemented HUD, live labels, Canvas effects and registry over the approved art.',
    'Keep the composition; remove baked UI and character; make portals live.',
  ],
  [
    'Logic and constraints',
    'Prioritized the employer brief over graphics.',
    'Added recommendations, history, priority ordering and storage error handling.',
    'Explain risk, enforce action restrictions, warn about creatures and log every operation.',
  ],
  [
    'Verification and delivery',
    'Reported issues in earlier versions; requested that their time not be counted.',
    'Ran tests, lint and build; checked the UI in the browser; prepared README and QA notes.',
    'Verify empty state, blocked actions, stabilization, history, movement and all six approaches.',
  ],
  [
    'Gameplay polish v3',
    'Specified lower portal orientation and traversable stairs, approved the final background and locked its geometry.',
    'Recorded its SHA-256; extended navigation onto stairs, added previews, repeat-action guards, reset confirmation, VFX and creature indicators. Tested transactions and UI.',
    'The background is final. Continue with walkable routes, collision, proximity, character, VFX, creatures, fire and UI over it.',
  ],
  [
    'Living scene and pixel UI',
    'Reported weak atmosphere, conventional fonts and snagging on sloping edges. Requested a polish patch preserving the background and domain logic.',
    'Added tangent sliding, facing based on actual movement, subtle gait, richer risk-driven effects, existing candle flames and local Pixelify Sans. Checked Russian/English panels and movement geometry.',
    'Remove the static-background feel; CRITICAL should be an order of magnitude more active than LOW; use a cohesive cozy fantasy pixel RPG interface.',
  ],
  [
    'Readability and lab worker',
    'Rejected the hard-to-read font and requested removal of eye badges and an original small lab worker inspired by a new reference.',
    'Removed the eye badges and replaced Pixelify Sans with Press Start 2P headings and PT Mono copy/numbers. ImageGen created the original worker; Codex aligned walk frames at the soles and checked RU/EN and narrow layouts.',
    'Keep the style but make letters and numbers readable; use a small pixel lab worker. Keep the background locked.',
  ],
  [
    'GAMEPLAY SYSTEMS REDESIGN',
    'Defined Intel/Observer risk–reward, Network Resonance, Quarantine, live countdown, Safe/Force Close, Collapse/Cascade, Restart Shift and Pause system.',
    'Extended the domain model and gameplay runtime; added Intel, network pressure, states, timer model, persistence and tests.',
    'Preserve the brief: explained risk, a quick review path, honest audit and worklog. Build a complete research/containment loop over the approved background.',
  ],
  [
    'BALANCE & LIVE SIMULATION',
    'During manual testing, found Mark Uncertain lacked a benefit, Force Close was too rewarding, Stability was static, review was slow and paused actions allowed unlimited thinking. Specified Caution Protocol, Rift Scars, Stability drift, Time Scale and live portal actions.',
    'Implemented these mechanics and targeted regression tests.',
    'Add benefits and costs, live drift and Time Scale; do not pause portal actions.',
  ],
  [
    'REMOTE INSPECTION & FINAL UX',
    'Requested click-to-inspect from anywhere, actions only nearby, movement as gameplay and concise onboarding. Reported final input and layout problems.',
    'Implemented read-only remote inspection, proximity-gated actions, updated How to Play and final UX fixes.',
    'Remote inspection, nearby control; fix stuck input and layout without changing domain logic.',
  ],
]
export function AIWorklog({
  language,
  onClose,
}: {
  language: Language
  onClose: () => void
}) {
  const ru = language === 'ru'
  return (
    <Modal
      title="AI Worklog"
      eyebrow={ru ? 'ПРОЦЕСС · РЕШЕНИЯ · ПРОВЕРКА' : 'PROCESS · DECISIONS · VERIFICATION'}
      language={language}
      onClose={onClose}
    >
      <p className="intro-copy">
        {ru
          ? 'Честный журнал совместной работы. Реализация текущей доработки выполнена AI; выбор направления и приоритетов принадлежит автору проекта.'
          : 'An honest account of collaboration. AI implemented this rework; the project author chose its direction and priorities.'}
      </p>
      <div className="worklog-facts">
        <article>
          <small>{ru ? 'Инструменты' : 'Tools'}</small>
          <strong>ChatGPT · Codex · ImageGen</strong>
        </article>
        <article>
          <small>{ru ? 'Время разработки' : 'Development time'}</small>
          <strong>{ru ? '15+ часов' : '15+ hours'}</strong>
          <p>
            {ru
              ? 'Итоговая оценка автора: проект завершён примерно за 15+ часов активной разработки. Точный поминутный таймер не вёлся.'
              : 'Final author estimate: the project was completed in approximately 15+ hours of active development. No precise minute-by-minute timer was kept.'}
          </p>
        </article>
        <article>
          <small>{ru ? 'Использование Codex' : 'Codex usage'}</small>
          <strong>{ru ? '9 × 5-часовых лимитных окон' : '9 × 5-hour usage windows'}</strong>
          <p>
            {ru
              ? 'За разработку было использовано 9 пятичасовых лимитных окон Codex. Из них 3 окна были получены через ручной сброс лимита, ещё 6 раз пришлось дождаться следующего доступного окна. Это показатель usage quota, а не количество токенов. Суммарное количество токенов не подсчитывалось.'
              : 'Development used 9 five-hour Codex usage windows. 3 windows were obtained through manual quota resets, while 6 required waiting for the next available window. This describes usage quota, not token count. Total token usage was not tracked.'}
          </p>
        </article>
      </div>
      <h3>{ru ? 'Этапы и ключевые запросы' : 'Stages and key prompts'}</h3>
      {(ru ? stages : stagesEn).map(([title, human, ai, prompt], i) => (
        <article className="worklog-stage" key={title}>
          <span className="stage-number">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <h3>{title}</h3>
            <p>
              <b>{ru ? 'Автор: ' : 'Author: '}</b>
              {human}
            </p>
            <p>
              <b>AI: </b>
              {ai}
            </p>
            <blockquote>{prompt}</blockquote>
          </div>
        </article>
      ))}
      <h3>{ru ? 'Решения автора' : 'Author decisions'}</h3>
      <ol>
        {(ru
          ? [
              'Пространственная лаборатория вместо обычной стартовой таблицы.',
              'Уютный pixel art и конкретный утверждённый референс.',
              'Сохранение расчёта риска и бизнес-правил при переделке сцены.',
              'Приоритет полного соответствия ТЗ над декоративными эффектами.',
              'Фиксация принятого фона: дальнейшие изменения только в интерактивных слоях.',
            ]
          : [
              'A spatial laboratory as the initial view.',
              'Cozy pixel art and the specific approved reference.',
              'Preserve risk and business rules during scene rework.',
              'Prioritize complete assignment coverage over decorative effects.',
              'Lock the approved background; continue only with interactive layers.',
            ]
        ).map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ol>
      <h3>{ru ? 'Ошибки AI и исправления' : 'AI mistakes and corrections'}</h3>
      <p>
        {ru
          ? 'В прошлых версиях AI растягивал фон, оставлял впечатываемые подписи и овал, смешивал проценты и CSS-координаты. Автор заметил проблемы. В этой доработке AI убрал эти решения: чистый фон, единый viewport, отдельные коллизии и тесты доступности подходов. При первом редактировании патч был отклонён инструментом из-за двух операций над одним файлом; запись исправлена, исходные данные не потеряны.'
          : 'Earlier AI iterations stretched the scene, retained baked labels and an oval, and mixed coordinate systems. The author reported these issues. This rework replaces them with a clean background, one viewport, explicit colliders and reachability tests. An initial patch was rejected for duplicate file operations; the write was corrected without losing source data.'}
      </p>
      <p>
        {ru
          ? 'В v3 ImageGen несколько раз сместил нижние порталы вместо разворота, оставил двойные контуры или сделал чёрную арку лежащей. Автор отклонил эти варианты и уточнил геометрические критерии. Принятый результат зафиксирован без дальнейшей генерации. При проверке кода обнаружен неподдерживаемый параметр exact в двух тестовых запросах Testing Library; исправлен перед production-сборкой.'
          : 'In v3, ImageGen repeatedly shifted portals instead of rotating their perspective, left doubled outlines or made the black arch horizontal. The author rejected these results and refined the geometric criteria. The approved asset was locked. Type checking also caught an unsupported exact option in two Testing Library queries; it was fixed before the production build.'}
      </p>
      <p>
        {ru
          ? 'После v3 автор справедливо отметил, что скольжение только по X/Y не решает застревание на наклонных дорожках, а Courier не заменяет пиксельный шрифт. AI исправил оба упрощения. При повторной проверке также найден преждевременный текст «наблюдатель отправлен» в предпросмотре: заменён описанием будущего действия до подтверждения.'
          : 'After v3, the author pointed out that X/Y-only sliding still snags on sloping paths and Courier is not a pixel font. AI corrected both shortcuts. Browser review also found premature “observer sent” wording in the preview; it now describes the future action until confirmed.'}
      </p>
      <p>
        {ru
          ? 'Pixelify Sans подходил по стилю, но автор заметил плохую читаемость кириллицы, латиницы и цифр. AI заменил его: пиксельные заголовки сохранены, мелкий текст и значения переведены на PT Mono. У нового sprite sheet строки оказались не идеально равномерными; смещения кадров откалиброваны в CSS без изменения movement system.'
          : 'Pixelify Sans matched the style but the author found Cyrillic, Latin and numbers hard to read. AI replaced it with pixel headings and PT Mono copy/values. The generated sprite rows were not perfectly uniform, so CSS frame offsets were calibrated without changing the movement system.'}
      </p>
      <p>
        {ru
          ? 'В новом gameplay-патче AI обнаружил риск тупика: запрет стабилизации при высокой стабильности мешал снижать энергию перед повторными экспедициями. Правило уточнено: при энергии от 60 стабилизация снова допустима. Старые ожидания тестов обновлены только там, где изменились seed и давление сети; проверки исходного risk engine сохранены.'
          : 'During the gameplay patch, AI identified a deadlock: blocking stabilization at high stability prevented venting energy for repeat expeditions. Stabilization now remains available at energy 60 or higher. Old test expectations changed only for the new seed/network pressure; intrinsic risk-engine checks remain intact.'}
      </p>
      <h3>{ru ? 'Что сделано вручную' : 'Manual contributions'}</h3>
      <p>
        {ru
          ? 'В рамках этой доработки ручные изменения кода автором не заявлены. Его вклад — исходное ТЗ, выбор визуального направления, оценка предыдущих результатов и корректировка приоритетов. Код, тесты и документацию изменял Codex.'
          : 'No manual code changes by the author were reported for this rework. Their contribution was the brief, visual direction, evaluation of earlier results and priorities. Codex edited code, tests and documentation.'}
      </p>
      <h3>{ru ? 'Проверка и дальнейшее развитие' : 'Verification and next steps'}</h3>
      <p>
        {ru
          ? 'Автотесты проверяют расчёт риска, ограничения действий, аудит, отчёт, движение, коллизии, достижимость порталов, сохранение и сценарии интерфейса. Проверки запускаются через npm test, npm run lint и npm run build. Подробные результаты — в README и QA-чеклисте.'
          : 'Automated tests cover risk, action restrictions, audit, reporting, movement, collisions, portal reachability, persistence and UI flows. Run npm test, npm run lint and npm run build. Detailed results are in README and the QA checklist.'}
      </p>
      <p>
        {ru
          ? 'Для реального продукта: серверное хранение и аудит, роли операторов, настоящая телеметрия, наблюдаемость ошибок, нарисованные вручную слои окружения и отдельное сенсорное управление. Сейчас это локальное демо; данные сохраняются только в браузере.'
          : 'For a real product: server persistence and audit, operator roles, live telemetry, error monitoring, hand-drawn environment layers and dedicated touch controls. This is a local demo; data is stored only in the browser.'}
      </p>
    </Modal>
  )
}
