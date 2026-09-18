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
    'Арт и интерфейс',
    'Выбрал уютную pixel-art лабораторию, отклонил овал, растяжение и статичную сцену.',
    'ImageGen очистил фон и создал спрайты. Codex собрал HUD, живые подписи, Canvas-эффекты и реестр.',
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
    'Art and interface',
    'Selected the cozy pixel-art direction and rejected distortion, the center oval and a static scene.',
    'ImageGen cleaned the background and created sprites. Codex implemented HUD, labels, Canvas effects and registry.',
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
          <strong>
            {ru ? 'Точный общий учёт не вёлся' : 'Total time was not tracked'}
          </strong>
          <p>
            {ru
              ? 'Предыдущие итерации исключены из учёта по просьбе автора. Зафиксированные отметки этой доработки — в docs/qa-checklist.md; они не равны общему времени разработки.'
              : 'Earlier iterations are excluded at the author’s request. Recorded checkpoints are in docs/qa-checklist.md; they are not the total development time.'}
          </p>
        </article>
        <article>
          <small>{ru ? 'Токены' : 'Tokens'}</small>
          <strong>{ru ? 'Не подсчитывались' : 'Not counted'}</strong>
          <p>
            {ru
              ? 'Суммарная статистика по всем сессиям недоступна. Оценка не выдумывается.'
              : 'Combined usage across sessions is unavailable. No estimate is invented.'}
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
