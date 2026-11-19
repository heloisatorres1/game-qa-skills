# Coverage: Pixel Swarm

**Product:** Pixel Swarm (1.0.0 (debug build on GitHub Pages)) · **Date:** 2026-11-19 · **Scope:** Store and currencies, boosters and slots, Level Complete rewards, player XP and level locks, player name. Read from the source code and the live build.

**Read from:** code: Pixel Swarm repository: js/app.js, js/data.js, index.html (inventory/rules.md) · url: https://heloisatorres1.github.io/pixel-swarm/ (inventory/inventory.md)

**Approval:** pending

Each feature and how many cases it has of each type. Rejected cases are not counted. A dash means no case: the "Gaps" column says why.

| Feature | Risk | Happy | Negative | Edge | Total | P1 | Unit | API | UI | Manual | Gaps |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Store and currencies | high | 5 | 2 | 4 | 11 | 5 | — | — | 10 | 1 |  |
| Boosters and slots | high | 1 | 2 | 3 | 6 | 2 | — | — | 6 | — |  |
| Level Complete and rewards | high | 3 | 2 | 1 | 6 | 4 | — | — | 6 | — |  |
| Player XP and level locks | medium | 1 | 1 | 1 | 3 | 1 | — | — | 3 | — |  |
| Player name | low | 1 | 1 | 1 | 3 | — | — | — | 2 | 1 |  |
| Release build | high | 1 | 1 | — | 2 | 2 | — | — | 2 | — | One build switch: a happy case and a negative case cover it; no edge input. |

**Automation:** 29 of 31 cases (94%) are suggested for automation. 2 stay manual.

| CI stage | Cases |
|---|---|
| push | 3 |
| pr | 13 |
| nightly | 11 |
| release | 4 |
| none | 0 |

| Technique | Cases |
|---|---|
| equivalence-partitioning | 8 |
| boundary-value | 10 |
| decision-table | 3 |
| state-transition | 5 |
| use-case | 2 |
| error-guessing | 1 |
| checklist | 2 |

| Status (all cases) | Cases |
|---|---|
| suggested | 31 |
| approved | 0 |
| rejected | 0 |
| changed | 0 |

## Not covered

| Area | Reason |
|---|---|
| Puzzle rules, level solvability, save system, daily rewards, events, settings, UI layout | Outside this run's scope. The test-puzzles, test-progression, test-settings and test-ui skills cover them |
| Real-money purchases | This build uses test purchases; the store integration of the phone app is not built yet |
| Unit tests | The rules live inside one closure in js/app.js and cannot be imported; see the automation plan |
