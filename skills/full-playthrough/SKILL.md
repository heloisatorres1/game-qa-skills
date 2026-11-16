---
name: full-playthrough
description: Engine-agnostic end-to-end playthrough - finish the whole game (every level, world, theme, mode, difficulty, ending and post-game unlock) the way a player would, while checking that progression, rewards and unlocks behave correctly. Builds a content inventory first so nothing is skipped, keeps a resumable progress log, and backs every result with screenshots and state reads. Use when the user asks to play through, complete, beat, 100% or run end-to-end testing of a game.
argument-hint: "[build URL or path] [scope: all | main path | <theme/world>]"
---

# Full Playthrough

Goal: prove that a player **can finish everything the game offers**, and find what stops them or rewards them wrongly on the way.

The result is a completion matrix, one row per piece of content, each with a status and proof. "I played some levels and they were fine" is not a result.

Load the shared standard first: read `../qa-evidence/SKILL.md`.

## 1. Recon and setup

1. Reach the game (see `../qa-evidence/references/game-access.md`). Record build, platform, access mode.
2. Find the **save data** and back it up to `evidence/save-backup/`. You will start from a clean save and restore the original at the end.
3. Find **debug tools**: level select, skip level, add currency, auto-solve, unlock all. Ask the user which are allowed. Rules:
   - Content completed **with** a skip/solve/unlock cheat is `assisted`, never `completed`.
   - Currency/booster cheats are allowed only to get past an economy wall, and must be logged.
   - The main path must be played without skips at least once, unless the user scopes it down.
4. Agree on scope with the user if the game is big: `all`, `main path only`, `one world`, `one difficulty`. Write it in `run.scope`.

## 2. Build the content inventory (before playing)

Find out what "everything" means **from the data, not from the menus**. Menus hide locked content; data does not.

- Search level/world definitions: data files, level folders, scene lists, `levels.json`, scriptable objects, `PS_LEVELS`-style tables, build settings scene list.
- Count: worlds/themes × levels × difficulties, modes (story, endless, daily, event), bosses, endings/branches, secret levels, post-game content, collectibles, achievements tied to completion.
- Note unlock rules for each item (what unlocks it, what it should reward).

Write `inventory.md` in the run folder using [references/inventory-template.md](references/inventory-template.md). Every row starts as `NOT_STARTED`. Show the totals to the user: "Found 6 themes × 3 difficulties × 10 levels = 180 levels, 1 event mode, 10 achievements."

If the data and the menus disagree (a level exists in data but no menu reaches it, or a menu shows 20 levels but data has 19), that is already a finding.

## 3. Play

Work through the inventory in the player's natural order (the order the game unlocks things). For every item:

1. **Before**: screenshot of the entry point + read the progress state (currency, stars, unlocks, level index).
2. **Play it for real.** For puzzles you may derive the solution from the level data; doing so is also a solvability check. Retry a reasonable number of times (default 3) before calling a level too hard; that is a `query` about difficulty, not a bug, unless it is impossible.
3. **After**: screenshot of the result screen + read the state again.
4. **Check the delta**: rewards granted match the data/UI, the next item unlocked, nothing else changed unexpectedly, the completion saved (reload once per world/theme to prove persistence).
5. **Update `inventory.md`** immediately: status, attempts, time, evidence file names, finding IDs.

Statuses per item: `completed` (played legitimately), `assisted` (finished with a debug aid, say which), `failed` (could not complete, finding filed), `blocked` (unreachable because of an earlier issue), `skipped` (out of scope, with reason).

### What to watch for while playing

- Soft-locks: no valid move, a popup that cannot be closed, input stops responding, infinite loading.
- Progression: level not unlocking, wrong next level, progress lost after reload, stars/score not saved, wrong level number shown.
- Rewards: amount differs from what is promised, reward given twice or not at all, rewards on retry/replay (is that intended? if unsure, `query`).
- Unwinnable states: a level that cannot be solved from the start, or a state reachable by normal play that makes it unwinnable.
- Endings: credits/ending screen reached, post-game state correct, "all complete" indicators.
- Performance drifts over a long session (note frame hitches and memory growth; deep checks belong to `test-performance`).
- Any text issue you see: note it for `text-review` (or file it with a screenshot).

### Playing many levels with a script (web builds)

A scripted player keeps 100+ levels consistent. Rules that keep it honest:

- **Real input only.** Click what a player clicks (blocks, buttons) through the page. Never call the game's own auto-solve, skip or win functions; those make the row `assisted`.
- **Derive moves from the rules or the published solution**, read from what is on screen (DOM classes, labels), not from hidden game objects.
- **Time is not a cheat, but say how you saved it.** If the game sells a faster speed, buy it in its own store. If the currency for it came from a debug menu, log that as an economy aid in the inventory.
- **Use a persistent browser profile** (`launchPersistentContext`) kept outside the repo, so the save survives between batches, and re-run the script until every row is final.
- **One screenshot per level is enough** (the result screen), plus the start of each section; keep them small (1x scale, JPEG ~60%).

A complete example: [`examples/pixel-swarm-playthrough/scripts/playthrough.mjs`](../../examples/pixel-swarm-playthrough/scripts/playthrough.mjs).

### Resumable progress (important for long games)

Playthroughs are long and the session may be compacted or interrupted. After **each** item, `inventory.md` must be current. When resuming, read `inventory.md` first and continue from the first row that is not final. Never redo finished rows from memory; trust the file.

Keep a running `playthrough-log.md` with one line per item: time, item, result, attempts, notes. It doubles as evidence of the route taken.

**Reconcile on every start.** Stopping a run abruptly (a killed process, a session limit, a reboot) can lose the game's last save write: the inventory says a level was won, the save does not, and the game correctly keeps the next level locked. So at every start, compare the save with the inventory before playing: rows the save does not have go back to "not started" with a note, and rows marked blocked are retried. Without this, one lost write shows up as a chain of false "blocked" levels. Also:
- keep the browser profile, a copy of the save after each level and the tools in a durable folder (not a temp folder), git-ignored;
- prefer a time budget the script respects (`MAX_MINUTES`) to killing it; it stops between levels;
- persistence checks taken during such an interruption are marked as harness events in the report, not counted as game results.

## 4. Bug handling during the run

- When something breaks, stop advancing. Capture evidence, then try to reproduce from the last clean point (restart the level, or reload the save from before it). Two reproductions make it `confirmed`. Record the reproduction on video when the tool can (`../qa-evidence/scripts/web-harness.mjs` for web builds, no ffmpeg needed).
- For web builds, script the routine parts (open level, read state, screenshot, write the inventory row) with the harness, and play the levels themselves. Scripts make the 100th level as well documented as the first.
- If it blocks progression and a workaround exists (restart, debug unlock), use the workaround, label later items `assisted` if needed, and continue. If no workaround exists, mark everything behind it `blocked`.
- Back up the save that reproduces a progression bug: `evidence/BUG-007-save.json`. Developers love a save file.

## 5. Finish

1. Final state: screenshot of the completion screen / 100% indicators / ending. Read the final save and compare it with the inventory totals (all levels marked complete? collectibles count?).
2. Restore the user's original save from the backup.
3. Write `findings.json`:
   - `coverage`: one area per world/theme/mode (status from its rows), plus `Ending / credits`, `Post-game`, `Persistence`.
   - `run.summary`: "Completed 172/180 levels legitimately, 6 assisted (economy wall in Hard Ocean), 2 blocked by BUG-003."
4. Build the report: `node ../qa-evidence/scripts/build-report.mjs qa-reports/<run>/findings.json`
5. Attach `inventory.md` and `playthrough-log.md` as evidence on the coverage areas.

## Done when

- [ ] Every inventory row has a final status (none left `NOT_STARTED` or `IN_PROGRESS`).
- [ ] Completed vs assisted counts are stated honestly in the summary.
- [ ] Each world/theme has at least one persistence check (reload) with evidence.
- [ ] The ending / final state is captured, or its absence explained.
- [ ] The original save is restored.
