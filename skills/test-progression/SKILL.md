---
name: test-progression
description: Tests save/load and progression systems in any engine - persistence across reloads, fresh-save and corrupted-save handling, level and feature unlocks, player XP/levels, daily rewards, quests/tasks, achievements, collections, timed events and their timers, including clock-change and day-rollover cases. Proves results with save-file diffs, state reads and screenshots. Use when the user asks to test saving, progression, unlocks, rewards, daily login, quests, achievements or live events.
argument-hint: "[build URL or path]"
---

# Test Progression

Load the shared standard first: read `../qa-evidence/SKILL.md`. Under `test-game-full`, write to `<run>/test-progression/`.

## 1. Map the systems

1. Locate the save: format, location, when it is written (every action, on level end, on quit), versioning/migration code.
2. List progression systems and their rules with `file:line`: unlock rules, XP curve, daily reward table, quest definitions, achievements, collections, events (start/end dates, currency, reward tracks).
3. Find how time is read (`Date.now`, system clock, server time). This decides how you can test timers.
4. **Back up the user's save** to `evidence/save-backup/` before anything else.

## 2. Test cases

**Save and load**
- [ ] PR-01 Fresh install / cleared save starts at the correct initial state (compare with the data defaults)
- [ ] PR-02 Every progress type survives a reload: level progress, currency, inventory, settings, tutorial flags, quest progress, event progress
- [ ] PR-03 Reload in the middle of a level: what is kept/lost matches the design (and no reward duplication from replaying the end)
- [ ] PR-04 Close at awkward moments (during reward animation, right after purchase, during save) then reload
- [ ] PR-04b **Leave a reward screen without its button** (tap outside, Escape, Back, home gesture): the reward is still paid, or the screen cannot be left. Compare coins before and after with the reward shown on screen
- [ ] PR-05 Corrupted or truncated save: game does not crash, recovers or resets with a message (test on a copy)
- [ ] PR-06 Old save format (if versioned): migrates without loss
- [ ] PR-07 Save diff: compare the save before/after one action; nothing unrelated changed

**Unlocks and player level**
- [ ] PR-10 Each unlock happens exactly at its condition, not before (try the step just before) and not after
- [ ] PR-11 Locked content cannot be reached through other paths (deep links, back navigation, URL params, level select)
- [ ] PR-12 XP and player level: gains match the table; level-up rewards granted once; max level handled

**Rewards and live ops**
- [ ] PR-20 Daily reward: claim once per day; second claim same day refused; next day available; streak breaks/continues as designed
- [ ] PR-21 Quests/tasks: progress counts the right actions (and not the wrong ones), completes at the target, reward once, resets on schedule
- [ ] PR-22 Achievements: unlock at the condition, once, persist; progress shown matches state
- [ ] PR-23 Collections: items added once, completion reward once
- [ ] PR-24 Events: visible only in their window, countdown correct, rewards at thresholds, event currency cleared or kept after the end as designed

**Time manipulation** (only on test builds/devices you control)
- [ ] PR-30 Day rollover at midnight local time (or the game's reset hour)
- [ ] PR-31 Clock moved forward: timers complete, no negative or huge values
- [ ] PR-32 Clock moved back: no repeated claims, no frozen timers (or documented as accepted for offline games)
- [ ] PR-33 Time zone change

For web games, fake time inside the page instead of changing the OS clock: override `Date.now` / `Date` with Playwright `page.clock` (or an init script) and record exactly which time you set.

## 3. Evidence pattern

- `PR-xx-save-before.json`, `PR-xx-save-after.json` and a diff (`PR-xx-save.diff`) for every persistence check.
- Screenshots of the claim/unlock moment and of the state after reload.
- For time tests, write the simulated timestamps in the steps.

## 4. Report

Coverage areas: `Save/load`, `Corrupted save`, `Unlocks`, `Player level`, `Daily rewards`, `Quests`, `Achievements`, `Events`, `Time handling`. **Restore the backed-up save**, then build:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-progression/findings.json
```

## Done when
- [ ] Every progress type in the save was checked across a reload.
- [ ] Every unlock rule was tested at the boundary.
- [ ] Time-based systems were tested with simulated time, or marked `NOT_TESTED` with the reason.
- [ ] The user's save is restored.
