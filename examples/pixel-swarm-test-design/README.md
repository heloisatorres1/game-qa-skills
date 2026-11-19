# test-design on Pixel Swarm

`test-design` read my game [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm) from its **source code** and its **live build**. The scope was the store, boosters and slots, Level Complete rewards, player XP and the player name. It produced **31 test cases**, **6 questions** and an automation plan.

This run stops after phase A, which is how the skill works by default. Nothing was implemented, because the cases and tools are not approved yet.

Run on 2026-11-19.

| Output | What it holds |
|---|---|
| [test-cases.md](test-cases.md) | 31 cases in 6 features. Every rule and case cites the code line it comes from |
| [test-cases.csv](test-cases.csv) | The same cases for a spreadsheet or a test management tool |
| [coverage.md](coverage.md) | Features by happy, negative and edge, and what is not covered |
| [questions.md](questions.md) | 6 questions for the team |
| [automation-plan.md](automation-plan.md) | Playwright tests that read the save, a gate before the GitHub Pages deploy, a refactor that turns 9 cases into unit tests, and Allure as a later option |
| [inventory/rules.md](inventory/rules.md) | What `scan-rules.mjs` found in the code: 69 possible rules (limits, messages, states, debug flags) with `file:line` |
| [inventory/inventory.md](inventory/inventory.md) | What `scan-page.mjs` found on the live page: the name field's limit of 14 characters, no test IDs |

| Type | Cases | | Priority | Cases | | Level | Cases |
|---|---|---|---|---|---|---|---|
| happy | 12 | | P1 | 14 | | ui | 29 |
| negative | 9 | | P2 | 9 | | manual | 2 |
| edge | 10 | | P3 | 8 | | unit, api | 0 now, 9 unit after a refactor |

## Reading code finds what clicking misses

Some cases come straight from gaps between two places in the code:

- **No Ads sold again.** The No Ads card checks whether the player owns No Ads, but the Special Offer card does not (TC-STORE-006).
- **Two slot limits.** The Add Slot booster stops at 7 slots, but the Out of Slots offer has no check (TC-BOOST-003).
- **Level Complete can be dismissed.** The Out of Slots pop-up is locked against outside taps, but Level Complete is not, and an outside tap closes it without paying (TC-WIN-003).
- **XP never moves.** The XP bar and the level locks exist, but no gameplay code adds XP (TC-XP-001).

## Checked against the bugs already found

The other skills in this repository found 5 main bugs in Pixel Swarm, listed in [FOUND-BUGS.md](../../FOUND-BUGS.md). This run's cases cover 4 of them:

| Bug | Case that would catch it |
|---|---|
| BUG-001: Level Complete closes on an outside tap, and the reward is lost | TC-WIN-003 |
| BUG-003: the store sells No Ads to players who own it | TC-STORE-006 |
| BUG-004: Add Slot from Out of Slots has no limit | TC-BOOST-003 |
| BUG-008: player XP never grows | TC-XP-001 |
| BUG-002: buttons off screen on 360 px phones | Not in this run's scope (layout belongs to `test-ui`) |

**This is not a blind test.** The run was done by someone who already knew these bugs. What makes it checkable is that each of those four cases cites the code lines that show the gap. A reader can open them and see that the case follows from the code, not from hindsight.

A fair blind test would run the skill on a product whose bugs are not known yet. The SauceDemo example did that, and its questions and failing tests are in [../saucedemo-test-design](../saucedemo-test-design/README.md).

## Not done

- **No tests were written or run.** This run stops at phase A, waiting for approval.
- **Release-build cases need a local release build.** TC-BUILD-001 and TC-BUILD-002 depend on `npm run build`.
- **The plan's code changes are suggestions only.** It suggests a refactor of the game and a change to its deploy workflow. Neither was made.
