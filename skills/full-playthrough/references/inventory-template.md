# Content inventory: <Game> <build>

Source of truth for the playthrough. Update after every item. Statuses: `NOT_STARTED` `IN_PROGRESS` `completed` `assisted` `failed` `blocked` `skipped`.

## Totals

| Content | Found in data | Reachable in UI | Completed | Assisted | Failed | Blocked | Skipped |
|---|---|---|---|---|---|---|---|
| Levels | 180 | 180 | 0 | 0 | 0 | 0 | 0 |
| Modes | 2 | 2 | | | | | |
| Endings | 1 | | | | | | |
| Achievements (completion-based) | 10 | | | | | | |

Data sources used: `path/to/levels.json`, `path/to/worlds.cs` ...

## Rules noted

- Unlock rule: level N+1 unlocks when level N is won.
- Reward per win: Easy 10 coins, Medium 20, Hard 40 (from `data.js:120`).
- Debug aids allowed by the user: auto-solve for Hard only; +coins for the store.

## Items

| # | World/Theme | Difficulty | Item | Unlock check | Status | Attempts | Time | Reward expected / got | Evidence | Findings |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Flowers | Easy | Level 1 | n/a (first) | NOT_STARTED | | | 10 / | | |
| 2 | Flowers | Easy | Level 2 | unlocked after L1 | NOT_STARTED | | | 10 / | | |

## Persistence checks

| After | Action | State before reload | State after reload | Result | Evidence |
|---|---|---|---|---|---|
| Flowers Easy L10 | page reload | level 11, 120 coins | | | |
