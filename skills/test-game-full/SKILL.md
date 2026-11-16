---
name: test-game-full
description: Full QA pass of a game, engine-agnostic. Detects which features the game has (store, puzzles/levels, progression and rewards, UI, settings, performance, tutorial, ads, audio, input, lifecycle, accessibility and more), builds a test plan, runs a smoke gate, then runs the matching feature skills (text-review, test-ui, test-settings, test-puzzles, test-store, test-progression, test-performance, full-playthrough) and merges everything into one evidence-backed report with a release verdict. Use when the user asks to test the whole game, run a full regression, a release check, or "test everything".
argument-hint: "[build URL or path] [quick | standard | complete]"
---

# Test Game: Full Pass

This skill is the test lead. It does not test features itself; it decides **what** to test, runs the right skill for each feature, keeps every module to the same evidence standard, and merges the results into one report someone can act on.

Load the shared standard first: read `../qa-evidence/SKILL.md`.

## Depth levels

| Level | What runs | Typical use |
|---|---|---|
| `quick` | Smoke gate + text-review + test-ui on main screens + the critical path of test-puzzles/test-store | Before sharing a build |
| `standard` (default) | Everything in the plan except full-playthrough | Regular regression |
| `complete` | `standard` + full-playthrough | Release candidate |

## Phase 1: Recon and feature detection

1. Create `qa-reports/<YYYY-MM-DD>-full/`. Each module writes into its own subfolder (`text-review/`, `test-store/`, ...).
2. Reach the game and record the run info (see `../qa-evidence/references/game-access.md`).
3. **Detect features** by combining three sources, and keep the proof for each:
   - **Code/data**: search for store/shop/iap/purchase, level/puzzle/board, save/load/localStorage/PlayerPrefs, daily/reward/quest/achievement/event, settings/volume/language, tutorial/onboarding, ad/rewarded, notification, leaderboard/multiplayer.
   - **UI**: walk every menu once and screenshot each screen (this tour is reused by test-ui).
   - **Docs**: README, GDD, store page.
4. Map each detected feature to the catalog in [references/feature-catalog.md](references/feature-catalog.md). The catalog says which skill covers it, or gives an inline checklist when there is no dedicated skill, and what Claude **cannot** test.

Write `test-plan.md`:

```markdown
| # | Feature | Present? | Proof of presence | Covered by | Capability | In scope |
|---|---|---|---|---|---|---|
| 1 | Store / IAP | yes | js/app.js:313 store list; screen 05-store.png | test-store | Partial (no real payments) | yes |
| 2 | Multiplayer | no | no network code found | - | - | n/a |
```

Show the plan to the user and ask for changes **once** (scope, depth, debug tools allowed, areas to skip). If they asked you to run without stopping, proceed with `standard`.

## Phase 2: Smoke gate

Run this before anything else. If it fails, stop and report: nothing else is meaningful.

- [ ] The game starts and reaches the main menu / first playable screen within a reasonable time (record the time).
- [ ] No errors/exceptions in the console or log during boot (save the log as evidence either way).
- [ ] The core loop can be entered: start a level/match/run and get back to the menu.
- [ ] A fresh save works (clear save data, start again).
- [ ] Main menu buttons each open something.

Save as `smoke/findings.json` with one coverage area `Smoke`. A failed gate gives the final report a `blocked` verdict.

## Phase 3: Run the modules

Run in this order. It goes from cheap and static to slow and stateful, so early modules find problems before long ones waste time on them:

1. `text-review` (static, can run while you set up the rest)
2. `test-ui`
3. `test-settings`
4. `test-puzzles` (or the core-gameplay checklist from the catalog for non-puzzle games)
5. `test-store`
6. `test-progression`
7. Inline catalog checklists for features with no dedicated skill (tutorial, ads, audio, input, lifecycle, accessibility...). Write them to `catalog/findings.json`.
8. `test-performance`
9. `full-playthrough` (only at `complete` depth)

For each module: load the skill (Skill tool, or read `../<skill>/SKILL.md`), pass it the run folder and the access details you already have so it skips its own recon, and let it write `<module>/findings.json`.

Rules between modules:

- **Reset state** between stateful modules (back up and restore saves). Note the save state each module started from.
- **Share findings, do not duplicate them.** If a module hits a bug already filed by an earlier one, it adds the earlier ID to `related` instead of filing it again.
- **Parallel work:** only static work (text-review extraction, data checks) may run in parallel through subagents. Anything that touches the running game runs one module at a time, because modules share save data.
- **Long sessions:** keep `test-plan.md` updated with each module's status (`pending` / `running` / `done` / `blocked`). On resume, read it first.
- **Scripted, crash-safe, re-runnable.** For web builds, write one script per module in `<run>/scripts/` on top of `../qa-evidence/scripts/web-harness.mjs`. Save each check's result the moment it is known (`makeCheck`), so a crash never loses the run, and re-run single checks with `ONLY=ID node scripts/<module>.mjs` for the second reproduction or after fixing the script.
- **Reuse recent runs.** A module that already ran on the same build (e.g. a text-review from this week) is merged, not repeated; say so in the plan.
- **Triage automated failures** (`qa-evidence` rule 9). A FAIL from a script is a lead, not a finding: look at its evidence, separate game bugs from script mistakes, fix the script and re-run. Record rejected flags in the coverage notes.

## Phase 4: Merge and decide

1. Deduplicate across modules: same root cause = one finding; the others become `related`.
2. Build the merged report:

   ```bash
   node ../qa-evidence/scripts/build-report.mjs qa-reports/<run>/smoke/findings.json qa-reports/<run>/*/findings.json --out qa-reports/<run>
   ```

3. Check coverage against the plan: every in-scope feature in `test-plan.md` must appear in the report coverage. Add any missing one as `NOT_TESTED` with a reason. Never let a feature disappear silently.
4. Prune unreferenced evidence before sharing: `node ../qa-evidence/scripts/prune-evidence.mjs <run>/*/findings.json --apply`.
5. Write `summary.md` for a producer or lead (one page):
   - **Verdict**: `Ready` / `Ready with known issues` / `Not ready` / `Blocked`, with one sentence of reasoning.
   - Counts by severity, confirmed only.
   - Top 5 risks, each with finding ID and player impact in one line.
   - What was not tested and why (capability limits, missing access, time).
   - Suggested next steps (fix order, what to retest).

## Reliability checklist (before handing over)

- [ ] Smoke gate result is in the report.
- [ ] Every `FAIL` area links findings; every `PASS` area has evidence.
- [ ] Every confirmed runtime bug has `repro_rate` of at least 2/2 and a screenshot or video (video for each bug when the tool can record).
- [ ] Every FAIL that came from a script was reviewed by eye; rejected flags are listed in coverage notes.
- [ ] Capability limits (manual-only checks) are listed, not hidden.
- [ ] The merged report builds with no errors.
- [ ] Original save data restored.
