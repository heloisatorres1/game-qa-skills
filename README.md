# Game QA Skills for Claude Code

Engine-agnostic game testing skills for [Claude Code](https://claude.com/claude-code). Each one turns the agent into a careful game tester. It finds the problems **and proves them** with screenshots, state reads, logs and `file:line` references, then writes a report a developer or producer can act on.

Unity, Godot, Unreal, web, desktop or mobile: the skills only need a playable build, the source, or both.

![Generated QA report for Pixel Swarm](docs/report-preview.png)

*A real report produced by `text-review` on my game [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm). [Read it](examples/pixel-swarm-text-review/report.md).*

## Bugs these skills found

Run on my own game, [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm). Each bug has a video, screenshots, save data before and after, and the line of code involved. All details are in **[FOUND-BUGS.md](FOUND-BUGS.md)**.

| | Bug | Severity | Reproduced |
|---|---|---|---|
| [BUG-001](FOUND-BUGS.md#bug-001-level-complete-closes-on-a-tap-outside-it-the-reward-is-lost) | Tapping outside Level Complete closes it: the reward is lost and the board is left empty | Major | 12/12 |
| [BUG-002](FOUND-BUGS.md#bug-002-settings-and-close-pushed-off-screen-on-360-px-phones) | On 360 px phones the top bar pushes Settings and the store's Close button off screen | Major | 3/3 |
| [BUG-003](FOUND-BUGS.md#bug-003-the-store-sells-no-ads-again-to-players-who-own-it) | The store sells the $4.99 offer with No Ads to players who already own No Ads | Major | 4/4 |
| [BUG-008](FOUND-BUGS.md#bug-008-player-xp-never-grows-the-player-stays-level-1-forever) | Player XP never grows: after 102 wins the player is still level 1, so level-gated content stays locked (found by the full playthrough) | Major | 2/2 |
| [BUG-004](FOUND-BUGS.md#bug-004-add-slot-from-out-of-slots-has-no-limit) | Add Slot from Out of Slots has no limit: 10 squeezed slots (the booster stops at 7) | Minor | 5/5 |

All of them are open (reported, not fixed yet). The [examples index](examples/README.md) lists every run and all 8 bugs, including the minor ones.

![BUG-001 storyboard](docs/bugs/BUG-001.png)

## Why I built this

I've led game QA teams for 6+ years. AI agents can now play and inspect games, but an agent that says "I tested the store, it works" is no use to a team. These skills hold the agent to the same rules I hold human testers to:

- **No finding without proof.** Every bug has repro steps, expected vs actual, and evidence that opens in the report.
- **Reproduce before reporting.** A runtime bug is only `confirmed` after 2 reproductions from a clean state. Seen once? It's an `observation`.
- **Honest coverage.** Every area ends as `PASS`, `FAIL`, `PARTIAL`, `BLOCKED` or `NOT_TESTED`, with a reason. Things an AI can't judge (fun, audio quality, real devices) are listed as manual, not hidden.
- **Facts apart from guesses.** `actual` is what was seen. Root-cause ideas go in `suspected_cause`, worded as hypotheses.

The report builder enforces these rules: it refuses a `findings.json` with a "confirmed" bug seen once, a FAIL with no linked bug, or evidence files that don't exist.

## The skills

| Skill | What it does | Proven on Pixel Swarm |
|---|---|---|
| [`text-review`](skills/text-review/SKILL.md) | Pulls every player-facing string from any engine (HTML, JSON, CSV/PO/XLIFF tables, Android/iOS strings, Godot scenes, Unity YAML, string literals in code), checks spelling, grammar, terms, placeholders and plurals, then screenshots the text in the running game to catch overlap and truncation. | 861 strings checked, 0 spelling errors, 6 text issues (2 only visible in the game) and 3 queries. [Report](examples/pixel-swarm-text-review/report.md) |
| [`full-playthrough`](skills/full-playthrough/SKILL.md) | Finishes the whole game: every level, theme, mode and ending. It builds a content inventory from the game data first, so locked or hidden content is not missed. It checks rewards and unlocks along the way, keeps a progress log it can resume from, and labels anything finished with cheats as `assisted`. | **102/102 levels** completed with real taps in 1 h 34 min (1 h 12 min of play), every reward and save checked. Found [BUG-008](FOUND-BUGS.md#bug-008-player-xp-never-grows-the-player-stays-level-1-forever). [Results](examples/pixel-swarm-playthrough/README.md) |
| [`test-game-full`](skills/test-game-full/SKILL.md) | The test lead. Detects which features the game has, writes a test plan, runs a smoke gate, then runs the matching feature skills and merges their results into one report with a release verdict. | 80 checks in 8 modules, 7 bugs (3 major), verdict "not ready for a store release". [Summary](examples/pixel-swarm-full/summary.md) |
| [`test-store`](skills/test-store/SKILL.md) | Prices vs data, currency deltas, insufficient funds, double purchase, restore, no-ads, rewarded ads, economy sources and sinks. Never spends real money. | 15 checks: prices and balances exact. Found [BUG-003](FOUND-BUGS.md#bug-003-the-store-sells-no-ads-again-to-players-who-own-it) (No Ads sold again) and a double-tap query. |
| [`test-puzzles`](skills/test-puzzles/SKILL.md) | Models the rules from the code, checks every level's data for solvability, then tries to break win/lose conditions and mechanics in the game. Every bug comes with a move trace. | All 102 levels solvable, all 10 mechanics won in the game. Found [BUG-004](FOUND-BUGS.md#bug-004-add-slot-from-out-of-slots-has-no-limit) (no slot limit). |
| [`test-progression`](skills/test-progression/SKILL.md) | Save/load, corrupted saves, unlock boundaries, XP, daily rewards, quests, achievements, events, clock and timezone changes. | 15 checks: 7-day rewards, unlocks and corrupted saves pass. Found [BUG-001](FOUND-BUGS.md#bug-001-level-complete-closes-on-a-tap-outside-it-the-reward-is-lost) (lost reward). Its XP check was not run in this pass; the playthrough caught the XP bug. |
| [`test-ui`](skills/test-ui/SKILL.md) | Screen map, navigation and back behaviour, popup stacking, and layout on 7 screen sizes from small phone to ultrawide. | 10 screens × 6 sizes. Found [BUG-002](FOUND-BUGS.md#bug-002-settings-and-close-pushed-off-screen-on-360-px-phones) (buttons off screen on 360 px) and a landscape overlap. |
| [`test-settings`](skills/test-settings/SKILL.md) | Every option: default, effect, persistence, reset. Audio is checked through real gain values. | 7/7 pass. "Sounds off" proven silent through the audio engine. |
| [`test-performance`](skills/test-performance/SKILL.md) | Boot and load times, frame time and 1% lows, memory over long sessions, throttled runs. Every number is measured against a budget, with 3 runs and the raw data. | 4/4 budgets met: boot 3.1 s, 1% low 58 fps at 4× CPU throttle, memory stable. |
| [`qa-evidence`](skills/qa-evidence/SKILL.md) | The shared standard all skills follow: how to reach the game, how to capture proof, statuses, severities and the `findings.json` format. Tools: the report builder (it enforces the rules), a Playwright harness that records **video without ffmpeg** and saves results crash-safe, and an evidence pruner. | Used by every run here: videos for every major bug, storyboards, and reports that refuse a bug without proof. |

"Proven" means a real run on my game [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm) v1.0.0, with every result in [examples](examples/README.md) and every bug in [FOUND-BUGS.md](FOUND-BUGS.md).

The full list of features `test-game-full` can cover, and how far an AI agent can go with each, is in the [feature catalog](skills/test-game-full/references/feature-catalog.md).

### How they fit together

```mermaid
flowchart LR
  F[test-game-full] --> S{Smoke gate}
  S -- fails --> R[Report: BLOCKED]
  S -- passes --> T[text-review] --> U[test-ui] --> SE[test-settings] --> P[test-puzzles] --> ST[test-store] --> PR[test-progression] --> C[catalog checklists] --> PF[test-performance] --> FP[full-playthrough]
  FP --> M[Merge + dedupe] --> R2[One report + release verdict]
  E[(qa-evidence standard)] -.-> T & U & SE & P & ST & PR & PF & FP
```

Each skill also works on its own. Start with `text-review`: it's the quickest to try.

## Example: full playthrough of Pixel Swarm (102/102 levels)

`full-playthrough` finished every level of Pixel Swarm from a fresh install: 5 themes × 3 difficulties × 6 levels, plus 12 Halloween event levels. Results are in [`examples/pixel-swarm-playthrough`](examples/pixel-swarm-playthrough) (its [README](examples/pixel-swarm-playthrough/README.md) has every number), with the [completion report](examples/pixel-swarm-playthrough/completion-report.html) (download it and open it in a browser) and the [inventory](examples/pixel-swarm-playthrough/inventory.md):

- **102/102 levels completed** in **1 h 34 min** (1 h 12 min of actual play), every one on the first attempt with 3 stars, and the Level Complete screen of each level as proof.
- Played with **real taps** in the solution order, read from the screen. No auto-solve, skip or win cheat. The only aid was 500 debug gems spent on the game's 8× speed, and it is logged.
- After every win the script checked the reward paid (4,590 coins, exactly the rule), the stars saved and the next level. Progress survived a reload after every section (17/17). The event reward track paid all 5 rewards.
- **It found BUG-008:** XP never grows, so after 102 wins the player is still level 1, and the Firefly bug and two avatars can't be unlocked by playing.
- The run survived interruptions: it saves after every level, and on each start it compares the game save with the inventory. Once, stopping the run lost a just-won level from the save. The script noticed, replayed that level, and the report says so.

![BUG-008 storyboard](docs/bugs/BUG-008.png)

## Example: full QA pass on Pixel Swarm

I ran `test-game-full` on my own game, [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm). Results are in [`examples/pixel-swarm-full`](examples/pixel-swarm-full), with the [merged report](examples/pixel-swarm-full/report.md) and the [test plan](examples/pixel-swarm-full/test-plan.md):

- **80 scripted checks in 8 modules**: smoke gate, UI at 6 screen sizes, settings, puzzles (all 102 levels verified solvable, all 10 mechanics won in the real game), store, progression and daily rewards, tutorial / ads / lifecycle / accessibility, and performance.
- **7 bugs found and proven**, each reproduced at least twice, with video, screenshots, before/after save data and the line of code involved. Among them:
  - The **Level Complete popup closes on a tap outside it**: the coin reward is lost and the player is left on an empty board (4/4, video).
  - On **360 px phones the top bar pushes Settings and the store's Close button off screen** (15 balance cases × 2 runs).
  - The store **keeps selling the $4.99 offer that includes No Ads to players who own No Ads** (2/2, video).
- **Script mistakes are caught, not reported.** Six automated "failures" turned out to be problems in my own test scripts. They are listed in the test plan, not filed as bugs.
- [`scripts/`](examples/pixel-swarm-full/scripts) holds every Playwright script, so each result can be reproduced with one command.

## Example: Pixel Swarm text review

I ran `text-review` on my own web game, [Pixel Swarm](https://github.com/heloisatorres1/pixel-swarm). Results are in [`examples/pixel-swarm-text-review`](examples/pixel-swarm-text-review):

- **861 strings** extracted with `file:line`. No spelling or grammar errors.
- The numbers in the copy were checked against live game data ("Collect all 102 pictures" = 5 themes × 3 difficulties × 6 levels + 12 event levels).
- **6 text findings and 3 queries.** Two of them only show up in the running game: the tutorial's step dots are drawn over the ad banner text (reproduced 3/3), and a store subtitle is cramped on phone widths.
- [`terms.md`](examples/pixel-swarm-text-review/terms.md) is a term sheet the team can adopt as a style guide.
- [`scripts/session.mjs`](examples/pixel-swarm-text-review/scripts/session.mjs) is the Playwright script that captured the evidence, so anyone can run it again.

![Close-up evidence: tutorial dots over banner text](examples/pixel-swarm-text-review/evidence/TXT-tutorial-dots-crop.png)

## Install

In Claude Code:

```
/plugin marketplace add heloisatorres1/game-qa-skills
/plugin install game-qa-skills@game-qa-skills
```

Or copy any folder from `skills/` into your project's `.claude/skills/` (or `~/.claude/skills/` for all projects). Keep `qa-evidence` next to the others, because they all use it.

**Requirements:** Node.js 18+ for the helper scripts (no npm packages needed). For web games, `playwright-core` goes in the run folder, never in your game project. It drives the Edge or Chrome you already have, so no browser download is needed.

## Use

Ask in plain language, or call a skill by name (installed as a plugin, the names get a prefix: `/game-qa-skills:text-review`):

```
/text-review ./my-game
Proofread all the player-facing text in this project and show me proof in the running build at http://localhost:8080
/test-store
Run a full QA pass on the build in ./Builds/WebGL, standard depth
/full-playthrough https://mygame.itch.io  scope: main path
```

Every run writes to `qa-reports/<date>-<skill>/`:

```
findings.json   # source of truth (schema: skills/qa-evidence/references/findings-schema.md)
evidence/       # screenshots, crops, state dumps, logs, save diffs
report.md       # paste into Jira, GitHub or Slack
report.html     # self-contained page (use --embed to inline the images)
```

You can also build a report from any `findings.json` yourself:

```bash
node skills/qa-evidence/scripts/build-report.mjs qa-reports/<run>/findings.json [--embed]
```

## Limits

These skills make an agent a disciplined tester. They do not replace one. An agent can't judge fun, game feel, audio quality, haptics or real-device performance, and it can't run real-money purchases or platform certification. The reports list these as manual checks, so a human tester knows exactly what's left.

## Repository layout

```
.claude-plugin/        plugin + marketplace manifests
skills/<name>/         SKILL.md, references/, scripts/
examples/              real runs with evidence and reports (index: examples/README.md)
  pixel-swarm-playthrough/   full-playthrough: 102/102 levels, completion report
  pixel-swarm-full/          test-game-full: 80 checks, merged report, summary
  pixel-swarm-text-review/   text-review: 861 strings, term sheet
FOUND-BUGS.md          the bugs found, with storyboards, causes and fixes
docs/                  report preview and bug storyboards (docs/bugs/)
```

## About

Made by **Heloisa Oller Torres**, QA Test Lead / Senior QA for games and software · [LinkedIn](https://www.linkedin.com/in/heloisa-torres-94250814a) · [GitHub](https://github.com/heloisatorres1)

Licensed under [MIT](LICENSE).
