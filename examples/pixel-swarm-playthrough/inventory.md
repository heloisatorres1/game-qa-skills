# Content inventory: Pixel Swarm v1.0.0 (debug build, commit db96df5)

Source of truth for the playthrough, rewritten after every level by `scripts/playthrough.mjs`.

## Totals

| Content | In data | Completed | Assisted | Failed | Blocked | Not started |
|---|---|---|---|---|---|---|
| Levels (5 themes x 3 difficulties x 6) | 90 | 90 | 0 | 0 | 0 | 0 |
| Halloween event levels | 12 | 12 | 0 | 0 | 0 | 0 |

Data sources: `js/pictures.js` (PS_LEVELS), `js/data.js` (LEVELS_PER_DIFFICULTY = 6, EVENT.levels = 12), `js/app.js` (WIN_COINS, EVENT_REWARDS, BOOSTERS).

## Rules noted

- Unlocks: Easy is open; Medium opens when all 6 Easy levels are won; Hard when Medium is done (`app.js:847`). Event level N+1 opens when N is won (`app.js:1106`).
- Reward per win (Continue): Easy 30, Medium 45, Hard 60 coins (`app.js:1123`). Stars: 3 minus extra slots used (min 1).
- Event: +10 pumpkins on the first win of each level; reward track at 20/40/60/80/120 pumpkins.
- How levels were played: real clicks on the blocks following the solution order of the game's solver (see script header). No auto-solve, skip or win cheat.
- Logged economy aid: 500 gems from the debug menu, spent in the Speed Store on the permanent 8x tier; the player taps the speed button up to 8x at the start of each level.

## Setup

```json
{
  "started": "2026-11-16T15:42:36.859Z",
  "first_launch": "age gate 18+, story skipped, welcome",
  "speed_aid": {
    "debug_gems_added": 500,
    "gems_before": 20,
    "gems_after_purchase": 20,
    "maxSpeed": 8
  }
}
```

## Items

| # | Theme | Difficulty | Level | Status | Attempts | Time (s) | Stars | Reward expected / got | Next unlocked | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Flowers | easy | Level 1 | completed | 1 | 112 | 3 | 30 / 30 | Level 2 Flowers • Easy | [start.jpg](evidence/001-start.jpg) [complete.jpg](evidence/001-complete.jpg) | tutorial level, played at 1x |
| 2 | Flowers | easy | Level 2 | completed | 1 | 19 | 3 | 30 / 30 | Level 3 Flowers • Easy | [complete.jpg](evidence/002-complete.jpg) |  |
| 3 | Flowers | easy | Level 3 | completed | 1 | 21 | 3 | 30 / 30 | Level 4 Flowers • Easy | [complete.jpg](evidence/003-complete.jpg) |  |
| 4 | Flowers | easy | Level 4 | completed | 1 | 20 | 3 | 30 / 30 | Level 5 Flowers • Easy | [complete.jpg](evidence/004-complete.jpg) |  |
| 5 | Flowers | easy | Level 5 | completed | 1 | 20 | 3 | 30 / 30 | Level 6 Flowers • Easy | [complete.jpg](evidence/005-complete.jpg) |  |
| 6 | Flowers | easy | Level 6 | completed | 1 | 20 | 3 | 30 / 30 | Level 7 Flowers • Medium | [complete.jpg](evidence/006-complete.jpg) |  |
| 7 | Flowers | medium | Level 7 | completed | 1 | 42 | 3 | 45 / 45 | Level 8 Flowers • Medium | [start.jpg](evidence/007-start.jpg) [complete.jpg](evidence/007-complete.jpg) |  |
| 8 | Flowers | medium | Level 8 | completed | 1 | 43 | 3 | 45 / 45 | Level 9 Flowers • Medium | [complete.jpg](evidence/008-complete.jpg) |  |
| 9 | Flowers | medium | Level 9 | completed | 1 | 40 | 3 | 45 / 45 | Level 10 Flowers • Medium | [complete.jpg](evidence/009-complete.jpg) |  |
| 10 | Flowers | medium | Level 10 | completed | 1 | 47 | 3 | 45 / 45 | Level 11 Flowers • Medium | [complete.jpg](evidence/010-complete.jpg) |  |
| 11 | Flowers | medium | Level 11 | completed | 1 | 44 | 3 | 45 / 45 | Level 12 Flowers • Medium | [complete.jpg](evidence/011-complete.jpg) |  |
| 12 | Flowers | medium | Level 12 | completed | 1 | 43 | 3 | 45 / 45 | Level 13 Flowers • Hard | [complete.jpg](evidence/012-complete.jpg) |  |
| 13 | Flowers | hard | Level 13 | completed | 1 | 63 | 3 | 60 / 60 | Level 14 Flowers • Hard | [start.jpg](evidence/013-start.jpg) [complete.jpg](evidence/013-complete.jpg) |  |
| 14 | Flowers | hard | Level 14 | completed | 1 | 62 | 3 | 60 / 60 | Level 15 Flowers • Hard | [complete.jpg](evidence/014-complete.jpg) |  |
| 15 | Flowers | hard | Level 15 | completed | 1 | 63 | 3 | 60 / 60 | Level 16 Flowers • Hard | [complete.jpg](evidence/015-complete.jpg) |  |
| 16 | Flowers | hard | Level 16 | completed | 1 | 61 | 3 | 60 / 60 | Level 17 Flowers • Hard | [complete.jpg](evidence/016-complete.jpg) |  |
| 17 | Flowers | hard | Level 17 | completed | 1 | 65 | 3 | 60 / 60 | Level 18 Flowers • Hard | [complete.jpg](evidence/017-complete.jpg) |  |
| 18 | Flowers | hard | Level 18 | completed | 1 | 64 | 3 | 60 / 60 | screen-theme | [complete.jpg](evidence/018-complete.jpg) |  |
| 19 | Fruits | easy | Level 1 | completed | 1 | 21 | 3 | 30 / 30 | Level 2 Fruits • Easy | [start.jpg](evidence/019-start.jpg) [complete.jpg](evidence/019-complete.jpg) |  |
| 20 | Fruits | easy | Level 2 | completed | 1 | 22 | 3 | 30 / 30 | Level 3 Fruits • Easy | [complete.jpg](evidence/020-complete.jpg) |  |
| 21 | Fruits | easy | Level 3 | completed | 1 | 20 | 3 | 30 / 30 | Level 4 Fruits • Easy 1,000 2x | [complete.jpg](evidence/021-complete.jpg) |  |
| 22 | Fruits | easy | Level 4 | completed | 1 | 20 | 3 | 30 / 30 | Level 5 Fruits • Easy 1,030 2x | [complete.jpg](evidence/022-complete.jpg) |  |
| 23 | Fruits | easy | Level 5 | completed | 1 | 20 | 3 | 30 / 30 | Level 6 Fruits • Easy 1,060 2x | [complete.jpg](evidence/023-complete.jpg) |  |
| 24 | Fruits | easy | Level 6 | completed | 1 | 21 | 3 | 30 / 30 | Level 7 Fruits • Medium 1,090 2x | [complete.jpg](evidence/024-complete.jpg) |  |
| 25 | Fruits | medium | Level 7 | completed | 1 | 42 | 3 | 45 / 45 | Level 8 Fruits • Medium 1,135 2x | [start.jpg](evidence/025-start.jpg) [complete.jpg](evidence/025-complete.jpg) |  |
| 26 | Fruits | medium | Level 8 | completed | 1 | 44 | 3 | 45 / 45 | Level 9 Fruits • Medium 1,180 2x | [complete.jpg](evidence/026-complete.jpg) |  |
| 27 | Fruits | medium | Level 9 | completed | 1 | 40 | 3 | 45 / 45 | Level 10 Fruits • Medium 1,225 2x | [complete.jpg](evidence/027-complete.jpg) |  |
| 28 | Fruits | medium | Level 10 | completed | 1 | 44 | 3 | 45 / 45 | Level 11 Fruits • Medium 1,270 2x | [complete.jpg](evidence/028-complete.jpg) |  |
| 29 | Fruits | medium | Level 11 | completed | 1 | 42 | 3 | 45 / 45 | Level 12 Fruits • Medium 1,315 2x | [complete.jpg](evidence/029-complete.jpg) |  |
| 30 | Fruits | medium | Level 12 | completed | 1 | 46 | 3 | 45 / 45 | Level 13 Fruits • Hard 1,360 2x | [complete.jpg](evidence/030-complete.jpg) |  |
| 31 | Fruits | hard | Level 13 | completed | 1 | 59 | 3 | 60 / 60 | Level 14 Fruits • Hard 1,420 2x | [start.jpg](evidence/031-start.jpg) [complete.jpg](evidence/031-complete.jpg) |  |
| 32 | Fruits | hard | Level 14 | completed | 1 | 61 | 3 | 60 / 60 | Level 15 Fruits • Hard 1,480 2x | [complete.jpg](evidence/032-complete.jpg) |  |
| 33 | Fruits | hard | Level 15 | completed | 1 | 70 | 3 | 60 / 60 | Level 16 Fruits • Hard 1,540 2x | [complete.jpg](evidence/033-complete.jpg) |  |
| 34 | Fruits | hard | Level 16 | completed | 1 | 57 | 3 | 60 / 60 | Level 17 Fruits • Hard 1,600 2x | [complete.jpg](evidence/034-complete.jpg) |  |
| 35 | Fruits | hard | Level 17 | completed | 1 | 68 | 3 | 60 / 60 | Level 18 Fruits • Hard 1,660 2x | [complete.jpg](evidence/035-complete.jpg) |  |
| 36 | Fruits | hard | Level 18 | completed | 1 | 65 | 3 | 60 / 60 | screen-theme | [complete.jpg](evidence/036-complete.jpg) |  |
| 37 | Animals | easy | Level 1 | completed | 1 | 22 | 3 | 30 / 30 | Level 2 Animals • Easy 1,750 2x | [start.jpg](evidence/037-start.jpg) [complete.jpg](evidence/037-complete.jpg) |  |
| 38 | Animals | easy | Level 2 | completed | 1 | 21 | 3 | 30 / 30 | Level 3 Animals • Easy 1,780 2x | [complete.jpg](evidence/038-complete.jpg) |  |
| 39 | Animals | easy | Level 3 | completed | 1 | 21 | 3 | 30 / 30 | Level 4 Animals • Easy 1,810 2x | [complete.jpg](evidence/039-complete.jpg) |  |
| 40 | Animals | easy | Level 4 | completed | 1 | 20 | 3 | 30 / 30 | Level 5 Animals • Easy 1,840 2x | [complete.jpg](evidence/040-complete.jpg) |  |
| 41 | Animals | easy | Level 5 | completed | 1 | 20 | 3 | 30 / 30 | Level 6 Animals • Easy 1,870 2x | [complete.jpg](evidence/041-complete.jpg) |  |
| 42 | Animals | easy | Level 6 | completed | 1 | 20 | 3 | 30 / 30 | Level 7 Animals • Medium 1,900 2x | [complete.jpg](evidence/042-complete.jpg) |  |
| 43 | Animals | medium | Level 7 | completed | 1 | 42 | 3 | 45 / 45 | Level 8 Animals • Medium 1,945 2x | [start.jpg](evidence/043-start.jpg) [complete.jpg](evidence/043-complete.jpg) |  |
| 44 | Animals | medium | Level 8 | completed | 1 | 41 | 3 | 45 / 45 | Level 9 Animals • Medium 1,990 2x | [complete.jpg](evidence/044-complete.jpg) |  |
| 45 | Animals | medium | Level 9 | completed | 1 | 43 | 3 | 45 / 45 | Level 10 Animals • Medium 2,035 2x | [complete.jpg](evidence/045-complete.jpg) |  |
| 46 | Animals | medium | Level 10 | completed | 1 | 46 | 3 | 45 / 45 | Level 11 Animals • Medium 2,080 2x | [complete.jpg](evidence/046-complete.jpg) |  |
| 47 | Animals | medium | Level 11 | completed | 1 | 44 | 3 | 45 / 45 | Level 12 Animals • Medium 2,125 2x | [complete.jpg](evidence/047-complete.jpg) |  |
| 48 | Animals | medium | Level 12 | completed | 1 | 44 | 3 | 45 / 45 | Level 13 Animals • Hard 2,170 2x | [complete.jpg](evidence/048-complete.jpg) |  |
| 49 | Animals | hard | Level 13 | completed | 1 | 69 | 3 | 60 / 60 | Level 14 Animals • Hard 2,230 2x | [start.jpg](evidence/049-start.jpg) [complete.jpg](evidence/049-complete.jpg) |  |
| 50 | Animals | hard | Level 14 | completed | 1 | 58 | 3 | 60 / 60 | Level 15 Animals • Hard 2,290 2x | [complete.jpg](evidence/050-complete.jpg) |  |
| 51 | Animals | hard | Level 15 | completed | 1 | 62 | 3 | 60 / 60 | Level 16 Animals • Hard | [complete.jpg](evidence/051-complete.jpg) |  |
| 52 | Animals | hard | Level 16 | completed | 1 | 54 | 3 | 60 / 60 | Level 17 Animals • Hard | [complete.jpg](evidence/052-complete.jpg) |  |
| 53 | Animals | hard | Level 17 | completed | 1 | 60 | 3 | 60 / 60 | Level 18 Animals • Hard | [complete.jpg](evidence/053-complete.jpg) |  |
| 54 | Animals | hard | Level 18 | completed | 1 | 66 | 3 | 60 / 60 | screen-theme | [complete.jpg](evidence/054-complete.jpg) |  |
| 55 | Sweets | easy | Level 1 | completed | 1 | 22 | 3 | 30 / 30 | Level 2 Sweets • Easy | [start.jpg](evidence/055-start.jpg) [complete.jpg](evidence/055-complete.jpg) |  |
| 56 | Sweets | easy | Level 2 | completed | 1 | 20 | 3 | 30 / 30 | Level 3 Sweets • Easy | [complete.jpg](evidence/056-complete.jpg) |  |
| 57 | Sweets | easy | Level 3 | completed | 1 | 20 | 3 | 30 / 30 | Level 4 Sweets • Easy | [complete.jpg](evidence/057-complete.jpg) |  |
| 58 | Sweets | easy | Level 4 | completed | 1 | 22 | 3 | 30 / 30 | Level 5 Sweets • Easy | [complete.jpg](evidence/058-complete.jpg) |  |
| 59 | Sweets | easy | Level 5 | completed | 1 | 22 | 3 | 30 / 30 | Level 6 Sweets • Easy | [complete.jpg](evidence/059-complete.jpg) |  |
| 60 | Sweets | easy | Level 6 | completed | 1 | 21 | 3 | 30 / 30 | Level 7 Sweets • Medium | [complete.jpg](evidence/060-complete.jpg) |  |
| 61 | Sweets | medium | Level 7 | completed | 1 | 44 | 3 | 45 / 45 | Level 8 Sweets • Medium | [start.jpg](evidence/061-start.jpg) [complete.jpg](evidence/061-complete.jpg) |  |
| 62 | Sweets | medium | Level 8 | completed | 1 | 43 | 3 | 45 / 45 | Level 9 Sweets • Medium | [complete.jpg](evidence/062-complete.jpg) |  |
| 63 | Sweets | medium | Level 9 | completed | 1 | 43 | 3 | 45 / 45 | Level 10 Sweets • Medium | [complete.jpg](evidence/063-complete.jpg) |  |
| 64 | Sweets | medium | Level 10 | completed | 1 | 46 | 3 | 45 / 45 | Level 11 Sweets • Medium | [complete.jpg](evidence/064-complete.jpg) [complete.jpg](evidence/064-complete.jpg) | played again: the first win was lost from the save when the test harness was stopped mid-write |
| 65 | Sweets | medium | Level 11 | completed | 1 | 44 | 3 | 45 / 45 | Level 12 Sweets • Medium | [complete.jpg](evidence/065-complete.jpg) |  |
| 66 | Sweets | medium | Level 12 | completed | 1 | 46 | 3 | 45 / 45 | Level 13 Sweets • Hard | [complete.jpg](evidence/066-complete.jpg) |  |
| 67 | Sweets | hard | Level 13 | completed | 1 | 64 | 3 | 60 / 60 | Level 14 Sweets • Hard | [start.jpg](evidence/067-start.jpg) [complete.jpg](evidence/067-complete.jpg) |  |
| 68 | Sweets | hard | Level 14 | completed | 1 | 59 | 3 | 60 / 60 | Level 15 Sweets • Hard | [complete.jpg](evidence/068-complete.jpg) |  |
| 69 | Sweets | hard | Level 15 | completed | 1 | 65 | 3 | 60 / 60 | Level 16 Sweets • Hard | [complete.jpg](evidence/069-complete.jpg) |  |
| 70 | Sweets | hard | Level 16 | completed | 1 | 63 | 3 | 60 / 60 | Level 17 Sweets • Hard | [complete.jpg](evidence/070-complete.jpg) |  |
| 71 | Sweets | hard | Level 17 | completed | 1 | 62 | 3 | 60 / 60 | Level 18 Sweets • Hard | [complete.jpg](evidence/071-complete.jpg) |  |
| 72 | Sweets | hard | Level 18 | completed | 1 | 61 | 3 | 60 / 60 | screen-theme | [complete.jpg](evidence/072-complete.jpg) |  |
| 73 | Ocean | easy | Level 1 | completed | 1 | 20 | 3 | 30 / 30 | Level 2 Ocean • Easy | [start.jpg](evidence/073-start.jpg) [complete.jpg](evidence/073-complete.jpg) |  |
| 74 | Ocean | easy | Level 2 | completed | 1 | 19 | 3 | 30 / 30 | Level 3 Ocean • Easy | [complete.jpg](evidence/074-complete.jpg) |  |
| 75 | Ocean | easy | Level 3 | completed | 1 | 22 | 3 | 30 / 30 | Level 4 Ocean • Easy | [complete.jpg](evidence/075-complete.jpg) |  |
| 76 | Ocean | easy | Level 4 | completed | 1 | 20 | 3 | 30 / 30 | Level 5 Ocean • Easy | [complete.jpg](evidence/076-complete.jpg) |  |
| 77 | Ocean | easy | Level 5 | completed | 1 | 21 | 3 | 30 / 30 | Level 6 Ocean • Easy | [complete.jpg](evidence/077-complete.jpg) |  |
| 78 | Ocean | easy | Level 6 | completed | 1 | 22 | 3 | 30 / 30 | Level 7 Ocean • Medium | [complete.jpg](evidence/078-complete.jpg) |  |
| 79 | Ocean | medium | Level 7 | completed | 1 | 43 | 3 | 45 / 45 | Level 8 Ocean • Medium | [start.jpg](evidence/079-start.jpg) [complete.jpg](evidence/079-complete.jpg) |  |
| 80 | Ocean | medium | Level 8 | completed | 1 | 44 | 3 | 45 / 45 | Level 9 Ocean • Medium | [complete.jpg](evidence/080-complete.jpg) |  |
| 81 | Ocean | medium | Level 9 | completed | 1 | 40 | 3 | 45 / 45 | Level 10 Ocean • Medium | [complete.jpg](evidence/081-complete.jpg) |  |
| 82 | Ocean | medium | Level 10 | completed | 1 | 44 | 3 | 45 / 45 | Level 11 Ocean • Medium | [complete.jpg](evidence/082-complete.jpg) |  |
| 83 | Ocean | medium | Level 11 | completed | 1 | 45 | 3 | 45 / 45 | Level 12 Ocean • Medium | [complete.jpg](evidence/083-complete.jpg) |  |
| 84 | Ocean | medium | Level 12 | completed | 1 | 41 | 3 | 45 / 45 | Level 13 Ocean • Hard | [complete.jpg](evidence/084-complete.jpg) |  |
| 85 | Ocean | hard | Level 13 | completed | 1 | 60 | 3 | 60 / 60 | Level 14 Ocean • Hard | [start.jpg](evidence/085-start.jpg) [complete.jpg](evidence/085-complete.jpg) |  |
| 86 | Ocean | hard | Level 14 | completed | 1 | 63 | 3 | 60 / 60 | Level 15 Ocean • Hard | [complete.jpg](evidence/086-complete.jpg) |  |
| 87 | Ocean | hard | Level 15 | completed | 1 | 61 | 3 | 60 / 60 | Level 16 Ocean • Hard | [complete.jpg](evidence/087-complete.jpg) |  |
| 88 | Ocean | hard | Level 16 | completed | 1 | 60 | 3 | 60 / 60 | Level 17 Ocean • Hard | [complete.jpg](evidence/088-complete.jpg) |  |
| 89 | Ocean | hard | Level 17 | completed | 1 | 58 | 3 | 60 / 60 | Level 18 Ocean • Hard | [complete.jpg](evidence/089-complete.jpg) |  |
| 90 | Ocean | hard | Level 18 | completed | 1 | 59 | 3 | 60 / 60 | screen-theme | [complete.jpg](evidence/090-complete.jpg) |  |
| 91 | Halloween (event) | easy | Event 1 | completed | 1 | 21 | 3 | 30 / 30 | screen-events | [start.jpg](evidence/091-start.jpg) [complete.jpg](evidence/091-complete.jpg) |  |
| 92 | Halloween (event) | easy | Event 2 | completed | 1 | 19 | 3 | 30 / 30 | screen-events | [complete.jpg](evidence/092-complete.jpg) |  |
| 93 | Halloween (event) | easy | Event 3 | completed | 1 | 20 | 3 | 30 / 30 | screen-events | [complete.jpg](evidence/093-complete.jpg) |  |
| 94 | Halloween (event) | easy | Event 4 | completed | 1 | 19 | 3 | 30 / 30 | screen-events | [complete.jpg](evidence/094-complete.jpg) |  |
| 95 | Halloween (event) | medium | Event 5 | completed | 1 | 42 | 3 | 45 / 45 | screen-events | [complete.jpg](evidence/095-complete.jpg) |  |
| 96 | Halloween (event) | medium | Event 6 | completed | 1 | 41 | 3 | 45 / 45 | screen-events | [complete.jpg](evidence/096-complete.jpg) |  |
| 97 | Halloween (event) | medium | Event 7 | completed | 1 | 42 | 3 | 45 / 45 | screen-events | [complete.jpg](evidence/097-complete.jpg) |  |
| 98 | Halloween (event) | medium | Event 8 | completed | 1 | 42 | 3 | 45 / 45 | screen-events | [complete.jpg](evidence/098-complete.jpg) |  |
| 99 | Halloween (event) | hard | Event 9 | completed | 1 | 66 | 3 | 60 / 60 | screen-events | [complete.jpg](evidence/099-complete.jpg) |  |
| 100 | Halloween (event) | hard | Event 10 | completed | 1 | 57 | 3 | 60 / 60 | screen-events | [complete.jpg](evidence/100-complete.jpg) |  |
| 101 | Halloween (event) | hard | Event 11 | completed | 1 | 61 | 3 | 60 / 60 | screen-events | [complete.jpg](evidence/101-complete.jpg) |  |
| 102 | Halloween (event) | hard | Event 12 | completed | 1 | 61 | 3 | 60 / 60 | screen-events | [complete.jpg](evidence/102-complete.jpg) |  |

## Persistence checks

| After | Action | Expected | After reload | Result |
|---|---|---|---|---|
| flowers-easy | page reload | 6 levels won | 6 in the save after reload | PASS |
| flowers-medium | page reload | 6 levels won | 6 in the save after reload | PASS |
| flowers-hard | page reload | 6 levels won | 6 in the save after reload | PASS |
| fruits-easy | page reload | 6 levels won | 6 in the save after reload | PASS |
| fruits-medium | page reload | 6 levels won | 6 in the save after reload | PASS |
| fruits-hard | page reload | 6 levels won | 6 in the save after reload | PASS |
| animals-easy | page reload | 6 levels won | 6 in the save after reload | PASS |
| animals-medium | page reload | 6 levels won | 6 in the save after reload | PASS |
| animals-hard | page reload | 6 levels won | 6 in the save after reload | PASS |
| sweets-easy | page reload | 6 levels won | 6 in the save after reload | PASS |
| sweets-medium | page reload | 4 levels won | 3 in the save after reload | FAIL |
| ocean-easy | page reload | 6 levels won | 6 in the save after reload | PASS |
| ocean-medium | page reload | 6 levels won | 6 in the save after reload | PASS |
| ocean-hard | page reload | 6 levels won | 6 in the save after reload | PASS |
| sweets-medium | page reload | 6 levels won | 6 in the save after reload | PASS |
| ocean-hard | page reload | 6 levels won | 6 in the save after reload | PASS |
| halloween-easy | page reload | 4 levels won | 4 in the save after reload | PASS |
| halloween-medium | page reload | 4 levels won | 8 in the save after reload | PASS |

## Final state

```json
{
  "at": "2026-11-16T17:17:06.978Z",
  "levels_in_save": {
    "flowers-easy": 6,
    "flowers-medium": 6,
    "flowers-hard": 6,
    "fruits-easy": 6,
    "fruits-medium": 6,
    "fruits-hard": 6,
    "animals-easy": 6,
    "animals-medium": 6,
    "animals-hard": 6,
    "sweets-easy": 6,
    "sweets-medium": 6,
    "ocean-easy": 6,
    "ocean-medium": 6,
    "ocean-hard": 6,
    "sweets-hard": 6
  },
  "event_levels": 12,
  "pumpkins": 120,
  "event_rewards_claimed": [],
  "gallery": 102,
  "stats": {
    "levels": 102,
    "hard": 34,
    "boosters": 0,
    "daily": 0,
    "coinsEarned": 4590,
    "firstTry": 90,
    "perfect": 102,
    "pixels": 68502,
    "eventWins": 12
  },
  "playerLevel": 1,
  "coins": 4690,
  "gems": 20,
  "boosters": {
    "add_slot": 1,
    "shuffle": 2,
    "wing": 2,
    "pick": 2
  },
  "gallery_screen_text": "Completed 102/102",
  "page_errors": 0
}
```
