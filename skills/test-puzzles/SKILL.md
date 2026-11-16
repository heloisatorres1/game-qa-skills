---
name: test-puzzles
description: Tests puzzle and level logic in any engine - every level solvable from its start state, win and lose conditions, rule edge cases, special blocks/mechanics, undo/restart/hint/boosters, scoring and stars, and level data integrity (counts, ids, impossible layouts). Combines static checks on level data with in-game runs, and proves results with state reads, screenshots and solution traces. Use when the user asks to test puzzles, levels, game rules, mechanics or solvability.
argument-hint: "[build URL or path] [levels: all | <range>]"
---

# Test Puzzles

Load the shared standard first: read `../qa-evidence/SKILL.md`. Under `test-game-full`, write to `<run>/test-puzzles/`.

The key idea: **understand the rules from the code and data, then try to break them in the game.** A level that looks fine on screen can be impossible in data, and a rule that reads well in code can fail with real input timing.

## 1. Model the rules

1. Find the level data and the rule code (win check, lose check, move validation, special mechanics, scoring).
2. Write `rules.md`: a short spec in your own words with `file:line` for each rule. Example: "Win: all pixels cleared (`app.js:1840`). Lose: all slots full and no valid move (`app.js:1902`)." Ask the user to confirm anything ambiguous; a wrong spec makes wrong bugs.
3. List every mechanic / special element (locked blocks, keys, ice, bombs, portals, timers...). Each one becomes a test group.

## 2. Static data checks (all levels, fast)

Write a small script in the run folder (do not modify the game) that loads the level data and checks:

- [ ] PZ-01 Level count and ids: no gaps, no duplicates, matches what the menus promise
- [ ] PZ-02 Each level references assets/pictures/elements that exist
- [ ] PZ-03 Resource balance: what the level needs vs what it provides (enough moves, matching pairs, colours that can be cleared)
- [ ] PZ-04 Solvability: if a solver or auto-play exists in the project, run it on every level; otherwise implement a simple one for the rules in `rules.md`, or at least check necessary conditions (counts, reachability)
- [ ] PZ-05 Difficulty data matches the labels (Easy levels are not harder than Hard by the game's own metrics)

Save the script and its output (`evidence/level-check.txt`). A level that fails a static check is a `static` finding with the data `file:line`.

## 3. In-game checks

Pick a sample: the first level, one level per mechanic, the hardest level by data, the last level, and every level flagged in step 2.

**Win / lose**
- [ ] PZ-10 Winning by the intended route shows the win screen once, grants the reward once
- [ ] PZ-11 Losing triggers exactly when the rules say (not one move early or late)
- [ ] PZ-12 The last move both wins and would lose (edge: last slot filled by the winning move): the game resolves it as the rules intend
- [ ] PZ-13 No state where the player can neither win, lose, nor act (soft-lock); if found, save the state

**Rules and mechanics (per mechanic)**
- [ ] PZ-20 The mechanic behaves as `rules.md` says, including its edge cases (first/last position, chained effects, two triggers at once)
- [ ] PZ-21 Invalid moves are refused with feedback, and do not change state
- [ ] PZ-22 Rapid input / input during animations does not skip rule checks or double-apply moves

**Player tools**
- [ ] PZ-30 Restart resets the level fully (score, moves, timers, boosters used)
- [ ] PZ-31 Undo (if any) restores the exact previous state, including counters
- [ ] PZ-32 Hints/boosters do what they say, cost what they say, and cannot be used to reach an invalid state
- [ ] PZ-33 Pause/resume during a level keeps the state
- [ ] PZ-34 **Every limit holds on every path.** List each way a limited resource can change (slots, moves, lives, boosters: from a booster, the fail popup, an ad reward, a shop item) and push each path past the limit. Limits are often checked in one handler and forgotten in another

**Scoring**
- [ ] PZ-40 Score, stars and best results computed as the rules say; best result is kept, not overwritten by a worse run

## 4. Evidence pattern

- State dumps at the start, at the bug, and after: `PZ-12-state-before.json`, `PZ-12-state-after.json`.
- A **move trace**: the exact list of moves that reproduces a bug (`PZ-12-moves.txt`). If you can, a script that replays it. Puzzle bugs without a move trace are hard to fix.
- Screenshots of the board before the key move and after.

## 5. Report

Coverage areas: `Level data`, `Solvability`, `Win/lose`, one area per mechanic, `Player tools`, `Scoring`. Build:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-puzzles/findings.json
```

## Done when
- [ ] `rules.md` exists and every rule has a `file:line`.
- [ ] Static checks ran on **all** levels (state the count).
- [ ] Every mechanic has at least one in-game check with evidence.
- [ ] Every puzzle bug has a move trace.
