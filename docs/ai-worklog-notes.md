# RIFT//WARDEN — AI Development Notes

> Исторические заметки из исходного проекта. Они описывают также заменённые решения (инерцию, старые ассеты и CSS). Актуальный Worklog доступен в приложении; текущая архитектура и проверки — в README и qa-checklist.md. Ранние итерации не включены в учёт времени по просьбе автора.

## Project context

Test assignment for the AI-first Developer position at MOX.

Selected scenario:
Laboratory of Unstable Portals.

## Human decisions

### Decision 001 — Spatial laboratory instead of a traditional dashboard

The original requirement can be implemented as a conventional list of portal cards.

I decided to use a spatial pixel-art laboratory instead.

The user controls a small technician character and can approach portals and laboratory terminals.

Reason:
- stronger product identity;
- scenario fits a game-like environment;
- gives the test assignment a distinctive presentation.

Constraint:
The game-like navigation must never make the application harder to use.

Therefore:
- portals will also support mouse interaction;
- all domain actions use conventional UI panels;
- keyboard controls will always be visible.

### Decision 002 — Web application, not a game

The project will visually resemble a small pixel game, but technically remain a React web application.

No game engine will be used.

Core portal logic will remain independent from visual components.

### Decision 003 — Deterministic risk engine

Portal Risk Score will be calculated using explicit rules instead of AI.

Reason:
- predictable behaviour;
- easy testing;
- easy explanation to the user;
- aligns with the requirements of the assignment.

## AI usage

ChatGPT is being used for:
- requirements decomposition;
- architecture discussion;
- implementation assistance;
- debugging;
- test design;
- code review;
- documentation assistance.

Final product decisions are reviewed and approved by the developer.
### Correction 001 — Keyboard layout bug found during manual QA

The first movement prototype used `KeyboardEvent.key` and compared typed characters with Latin `W`, `A`, `S`, `D` and `E`.

During manual testing on a Russian keyboard layout, the developer found that arrow keys worked while WASD and E did not. The browser reports Cyrillic characters through `event.key` in that layout.

Fix:
- switched gameplay controls to `KeyboardEvent.code` (`KeyW`, `KeyA`, `KeyS`, `KeyD`, `KeyE`);
- controls now depend on the physical key position instead of the active keyboard language;
- added regression tests for physical WASD/E codes and arrow-key compatibility.

This was an AI-assisted implementation mistake caught by developer testing and corrected before submission.

### Decision 004 — Fit the laboratory into one desktop viewport

The first prototype kept a fixed 16:9 aspect ratio with a large minimum height, which caused the game area to overflow vertically on the developer's monitor.

The layout was changed to use the available browser viewport height while keeping the HUD visible. The portal world now fills the remaining space instead of forcing the page to scroll.

## Development checkpoint - Operations and localization

### Decision — Bilingual operator interface

Added an EN/RU language switch before the final visual pass.

Reason:
- language is UI state, so it is safer to establish the localization boundary before polishing;
- Russian text must use the same layout system instead of being added as an afterthought;
- the final pixel font must explicitly support both Latin and Cyrillic glyphs.

Implementation constraint:
Domain logic stays language-independent. Risk factors and action validation return stable codes; translation happens only in the presentation layer.

### Correction — Lint and movement-effect cleanup

Manual QA exposed two development-hygiene issues:
1. Oxlint scanned extracted patch folders and timestamped backups, duplicating warnings.
2. The movement hook synchronously set movement state while disabling an effect.

Changes:
- lint scope is limited to `src`;
- movement derives visible movement state without synchronously resetting state inside the effect;
- generated patch and backup folders remain outside production lint scope.

### Decision — Audit trail and QA scenarios

Added a persistent event log and system report before visual polish.

Reason:
These features directly cover the assignment requirements for action history, current summary, rejected actions, explainable state changes, and empty-list behavior.

The SYSTEM terminal also exposes a dedicated empty-lab scenario so a reviewer can verify the edge case without editing source data.

### Correction — Isolated automated test discovery

Two patch-install attempts revealed that a Vitest CLI path argument acts as a filename filter rather than a strict discovery root. Because extracted `_patch_*` directories contained copied test files, Vitest still discovered those files and attempted to execute them outside a complete source tree.

Fix:
- added a repository-level `vitest.config.ts`;
- test discovery is explicitly limited to `src/tests/**/*.test.ts`;
- patch folders, backups, build output and dependencies are excluded;
- npm test scripts use that config explicitly.

This is another AI-assisted implementation issue caught by validation before the feature patch was accepted.
## Development checkpoint - Visual wow pass

### Decision 006 - Preserve stable domain logic and upgrade only the presentation layer

After the operations, audit log and localization milestone, the product logic was already stable.

Instead of adding more mechanics immediately, I chose to improve the visual presentation of the laboratory.

Reason:
- the test assignment benefits from a stronger first impression;
- the spatial pixel-lab concept is now clearly visible;
- keeping logic untouched reduces regression risk.

### AI issue found during patch workflow

Earlier patch packaging accidentally caused test discovery to include unpacked patch folders.

The issue was caught during real installation on Windows and fixed by tightening the Vitest configuration in a previous patch.

This was a useful reminder that tooling and delivery scripts also need explicit scope control.
## Development checkpoint - Cozy basement art-direction rework

### Decision 007 - Global wrapper redesign instead of adding more logic

The application already had a working interaction layer, control panels, localization and persistence.

The next priority was to improve the perceived quality of the test assignment by changing the art direction.

Goals of this redesign:
- move away from a cold dashboard vibe;
- create a cozy pixel-game feeling;
- improve spatial readability with a stronger room perspective;
- make portals feel more like placed world objects.
## Development checkpoint - v0.5.1 scene rebuild hotfix

### Decision 008 - replace unstable CSS composition with one stable scene wrapper

The previous visual wrapper overreached and produced a composition that did not match the intended cozy pixel-game direction.

This patch rebuilds the scene around a stable single room layout and keeps the original interaction logic intact.
## Development checkpoint - v0.6.0 full scene rebuild

### Decision 009 - abandon patchwork scene styling and rebuild the room from zero

The previous wrapper iterations produced unstable composition and failed to match the intended cozy pixel-art vibe.

This patch fully rebuilds the scene around one coherent room: brick walls, warm light, deeper floor perspective, consistent portal staging, and cleaned panel styling.
## Development checkpoint — v0.7.0 approved visual direction

### Decision 010 — use the approved pixel-art hub as scene art instead of rebuilding the environment from CSS

The previous CSS-driven scene iterations failed to match the intended cozy game-art direction.

v0.7.0 uses the approved hub artwork as the scene foundation while keeping portal interaction, risk state, labels, character movement, particles, music, settings, audit log and system behavior live in React.

---
## Development checkpoint — v0.7.1 scene hotfix pass

### Decision 011 — stabilize the approved scene before further visual iteration

After applying the approved scene direction from v0.7.0, the first live playtest exposed usability problems: insufficiently visible effects, mismatch between portal art and interaction range, movement that felt too slippery, click / label overlay glitches, and lack of collision around portals.

v0.7.1 focuses on making the approved scene actually playable: stronger portal feedback, smoother movement with inertia, collision blocking on portal footprints, corrected interaction anchors for the upper portals, passive label cards, tighter hotspot placement, and small scene polish to preserve immersion.

---
## Development checkpoint — v0.7.2 collision + scene life pass

### Decision 012 — fix scene readability, collision, and depth cheats before any new content work

The approved v0.7.x art direction remained valid, but live playtesting still showed five immersion breakers: the scene felt too static, a broken label artifact appeared in the upper-left corner, the carpet-center oval remained visible, movement still felt too slippery, and the player could visually overlap portal structures in a flat way.

v0.7.2 addresses those points with stronger portal VFX, extra ambient sparkles, rebuilt label positioning, stronger center masking, slower and tighter movement tuning, and broader collision zones around portal facades / architecture so the scene behaves more like a layered space instead of a flat painted backdrop.

## v0.7.3 fullscreen layout + fx + collision tune
- перевёл игровую сцену в fullscreen layout без внешней рамки и широких боковых полей;
- убрал дополнительную CSS-маску в центре сцены, которая визуально давала крупный оранжевый шар;
- перестроил overlay порталов: оставил hotspot + FX, отключил дублирующие overlay-лейблы, которые давали артефакты;
- уменьшил и упростил sprite-подачу персонажа, убрал лишний aura/lantern overlay;
- замедлил движение, усилил drag и скорректировал стартовую позицию;
- обновил collision map и точки интеракции для верхних и нижних порталов.
