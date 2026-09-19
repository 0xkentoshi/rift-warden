# Gameplay patch: audit and decisions

Baseline: main 71002aa. Existing risk factors and thresholds, six scene placements, walkable stairs, collision/sliding, asset lock, readable fonts and worker atlas remain the foundation.

## Audit
- Domain: open/closed only; observation is an audited no-op; no Intel or live time.
- Risk: pure intrinsic calculation suitable for reuse. Do not add difficulty points directly.
- Validation/preview/commit: useful existing shared transaction; preserve critical observer prohibition, creature acknowledgement, closed/expired guards and click latch.
- Recommendation: can recommend observation at CRITICAL with high stability; route all candidates through validation.
- Audit: risks shown even when unchanged; add category/closure/diffs and retain real timestamps.
- Storage v2: validates base numeric fields, statuses, IDs and JSON. Migrate to v3 without replacing old key contents.
- Movement/collision and approved art: no rewrite or coordinate changes.
- VFX: existing one low-resolution Canvas at 30 fps; extend states and use effective assessment.
- Tests: 65 baseline tests include domain, storage, transactions, keyboard, scene and reachability. Extend, preserve existing coverage.
- README/Worklog/QA: obsolete static-time and no-op-observer text must be replaced; distinguish automated from actual browser QA.

## Chosen model
Clockwise progression: Mossbound Door (green,1), Mirror Rift (orange,2), Azure Bloom (blue,3), Silent Arch (black,4), Void Passage (purple,5), Crimson Gate (red,6).
Required portal fields extend the old model; lifecycle remains one status. Runtime phase: RUNNING / PAUSED / GAME_OVER / SHIFT_COMPLETE.
Remaining minutes are a fractional duration in the existing field, advanced from monotonic elapsed timestamps twice per second. All blocking UI and hidden tabs pause. Reload restores remaining duration with a fresh clock; no offline penalty.
Observation is an immediate confirmed expedition: Intel and energy change atomically, no artificial travel delay or unmanaged observer timer.
Safe closure requires Intel 100 AND no known occupants. Others remain closable after explicit forced-closure warning.
Three collapsed portals exceed containment capacity. A single loss can be survived. Completion requires all remaining active portals fully researched and LOW, no uncertainty or quarantine; closed/contained losses are reported honestly, not counted as research.
Validated balance: initial resonance 38; 39-operation deterministic full-research policy; Green 1 expedition and Red 8. 126 tests cover the existing brief and new gameplay. Browser QA includes paid research, isolation, a complete shift and a dangerous fixture with incident log and restart. No currency, inventory, backend or new art generation.

## Final review corrections
- Stable/high-energy rifts may vent at energy >=60, preventing repeat-research deadlocks.
- Observer returns are atomic system events; no unmanaged travel timer.
- Audit is retained until Restart so forced-closure totals remain truthful.
- Browser review found resonance=0 in collapse-started events. Those events and shift-complete now capture the actual network value; regression covered.
- Remaining limitations and distinct automated/manual evidence are in qa-checklist.md.
