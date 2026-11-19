# Test cases: Pixel Swarm

**Product:** Pixel Swarm (1.0.0 (debug build on GitHub Pages)) · **Date:** 2026-11-19 · **Scope:** Store and currencies, boosters and slots, Level Complete rewards, player XP and level locks, player name. Read from the source code and the live build.

**Read from:** code: Pixel Swarm repository: js/app.js, js/data.js, index.html (inventory/rules.md) · url: https://heloisatorres1.github.io/pixel-swarm/ (inventory/inventory.md)

**Approval:** pending

A casual web puzzle game: bees eat a pixel picture color by color from limited slots. Players earn coins by winning levels and spend coins and gems on boosters and speed; real-money items are test purchases in this build.

## Summary

31 cases in 6 features. 6 open question(s). See [coverage.md](coverage.md) and [questions.md](questions.md).

| Type | Cases | | Priority | Cases | | Automation | Cases |
|---|---|---|---|---|---|---|---|
| happy | 12 | | P1 | 14 | | unit | 0 |
| negative | 9 | | P2 | 9 | | api | 0 |
| edge | 10 | | P3 | 8 | | ui | 29 |
|  |  | |  |  | | manual | 2 |

**What hurts most if it breaks:** Currencies and purchases: a wrong charge or a lost reward breaks trust; No Ads is a paid entitlement and must never be sold twice; Slot limits decide whether a level is fair; Level-gated content must unlock through play.

**Existing tests:** A debug self-test in the game (js/app.js around line 2700 and 2890: save slots, report form). No automated test suite in the repository.

## Store and currencies (F-STORE)

Risk: **high**. Money and paid entitlements. Source: js/app.js:61-76 (PRODUCTS); js/app.js:310-394 (renderStore, grant, buy).

Rules found:

- **R-STORE-1** Gem packs: 100 for $0.99, 550 for $4.99, 1,200 for $9.99 *(js/app.js:65-69)*
- **R-STORE-2** Coin packs bought with gems: 1,000 for 30 gems, 5,000 for 120, 12,000 for 250 *(js/app.js:70-74)*
- **R-STORE-3** Not enough gems for a coin pack: toast 'Not enough gems (need <price>)' and nothing changes *(js/app.js:391)*
- **R-STORE-4** Special Offer $4.99: +1,200 gems, +10,000 coins and No Ads *(js/app.js:62, js/app.js:376-378)*
- **R-STORE-5** No Ads $2.99; once owned the card shows a disabled 'Owned' button *(js/app.js:324-326)*
- **R-STORE-6** Free Coins: +100 per video, 5 per local day; the button is disabled at 0 left *(js/app.js:75, js/app.js:302-308, js/app.js:357-359)*
- **R-STORE-7** Restore: 'No Ads is already active' when owned, else 'No purchases to restore (test mode)' *(js/app.js:3003)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-STORE-001](#tc-store-001) | Buying 1,000 coins for 30 gems moves the exact amounts | happy | P1 | ui · push | suggested |
| [TC-STORE-002](#tc-store-002) | Coin pack with too few gems is refused and nothing changes | negative | P1 | ui · pr | suggested |
| [TC-STORE-003](#tc-store-003) | Coin pack with exactly the price in gems leaves 0 gems | edge | P2 | ui · pr | suggested |
| [TC-STORE-004](#tc-store-004) | Each gem pack adds its exact amount | happy | P2 | ui · pr | suggested |
| [TC-STORE-005](#tc-store-005) | No Ads purchase removes the banner and shows Owned | happy | P1 | ui · push | suggested |
| [TC-STORE-006](#tc-store-006) | A player who owns No Ads is not sold No Ads again in the Special Offer | negative | P1 | ui · pr | suggested |
| [TC-STORE-007](#tc-store-007) | Special Offer grants 1,200 gems, 10,000 coins and No Ads | happy | P1 | ui · pr | suggested |
| [TC-STORE-008](#tc-store-008) | Free Coins stop after the 5th video of the day | edge | P2 | ui · nightly | suggested |
| [TC-STORE-009](#tc-store-009) | Free Coins reset at the player's local midnight | edge | P3 | ui · nightly | suggested |
| [TC-STORE-010](#tc-store-010) | Restore purchases says No Ads is active when owned | happy | P3 | ui · nightly | suggested |
| [TC-STORE-011](#tc-store-011) | Double tap on a coin pack charges once | edge | P2 | manual · release | suggested |

### TC-STORE-001

**Buying 1,000 coins for 30 gems moves the exact amounts**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P1 (Currency exchange: every number must be exact)
- **Automation:** ui, CI stage push. Exact numbers readable from the save; runs on every change
- **Source:** R-STORE-2
- **Status:** suggested

Preconditions:

- Fresh save, then 100 gems and 0 coins (debug: zero, then gems)

Steps:

1. Open the Store
2. Tap the 1,000 coins pack (30 gems)

Expected:

- Gems 100 -> 70, coins 0 -> 1,000, in the HUD and in the save (localStorage pixelswarm.save.v1)
- Toast '+1,000 coins'

### TC-STORE-002

**Coin pack with too few gems is refused and nothing changes**

- **Type:** negative · **Technique:** boundary-value · **Priority:** P1 (A refused purchase must never charge)
- **Automation:** ui, CI stage pr. Money rule at the boundary
- **Source:** R-STORE-3
- **Status:** suggested

Preconditions:

- 29 gems, 0 coins (debug: zero, then gems; spend to 29, or edit the save)

Test data: 29 gems vs a 30-gem pack (one below the price)

Steps:

1. Open the Store
2. Tap the 1,000 coins pack

Expected:

- Toast 'Not enough gems (need 30)'
- Gems stay 29, coins stay 0

### TC-STORE-003

**Coin pack with exactly the price in gems leaves 0 gems**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (On-the-boundary purchase)
- **Automation:** ui, CI stage pr. Cheap boundary check
- **Source:** R-STORE-2; R-STORE-3 (state.gems < c.gems)
- **Status:** suggested

Preconditions:

- Exactly 30 gems, 0 coins

Steps:

1. Open the Store
2. Tap the 1,000 coins pack

Expected:

- Gems 30 -> 0, coins 0 -> 1,000

### TC-STORE-004

**Each gem pack adds its exact amount**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P2 (Paid items in the real app)
- **Automation:** ui, CI stage pr. Data-driven, three rows
- **Source:** R-STORE-1
- **Status:** suggested

Preconditions:

- 0 gems

Test data: 100, 550 and 1,200 gem packs

Steps:

1. Buy the 100 pack
2. Buy the 550 pack
3. Buy the 1,200 pack

Expected:

- Gems after each: 100, 650, 1,850
- Toasts 'Test purchase: +100 gems', '+550 gems', '+1,200 gems'

### TC-STORE-005

**No Ads purchase removes the banner and shows Owned**

- **Type:** happy · **Technique:** state-transition · **Priority:** P1 (Paid entitlement)
- **Automation:** ui, CI stage push. Entitlement must survive reloads
- **Source:** R-STORE-5
- **Status:** suggested

Preconditions:

- Fresh save, No Ads not owned

Steps:

1. Open the Store
2. Tap No Ads ($2.99)
3. Reload the game

Expected:

- Toast 'Test purchase: No Ads activated'
- The No Ads card shows a disabled 'Owned' button
- After reload: still Owned, no banner in a level

### TC-STORE-006

**A player who owns No Ads is not sold No Ads again in the Special Offer**

- **Type:** negative · **Technique:** decision-table · **Priority:** P1 (Charging twice for an entitlement is a refund and trust problem)
- **Automation:** ui, CI stage pr. Cheap check once the rule is decided
- **Source:** R-STORE-4 and R-STORE-5: the No Ads card checks state.noAds (js/app.js:324) but the offer card (js/app.js:314-318) does not; the offer pop-up does (js/app.js:698)
- **Assumption:** An owned entitlement should not be sold again (Q-01)
- **Status:** suggested

Preconditions:

- No Ads owned

Steps:

1. Open the Store
2. Look at the Special Offer card

Expected:

- The offer either hides No Ads, shows it as owned, or is replaced; its price is not charged for No Ads again

### TC-STORE-007

**Special Offer grants 1,200 gems, 10,000 coins and No Ads**

- **Type:** happy · **Technique:** use-case · **Priority:** P1 (Biggest bundle)
- **Automation:** ui, CI stage pr. Exact numbers from the save
- **Source:** R-STORE-4
- **Status:** suggested

Preconditions:

- Fresh save: 0 gems, 0 coins, No Ads not owned

Steps:

1. Open the Store
2. Tap the Special Offer ($4.99)

Expected:

- Gems 1,200, coins 10,000, No Ads owned
- Toast 'Test purchase: +1,200 gems, +10,000 coins, No Ads'

### TC-STORE-008

**Free Coins stop after the 5th video of the day**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Daily cap on a free currency source)
- **Automation:** ui, CI stage nightly. Boundary at 5; the test ad must be skippable in tests
- **Source:** R-STORE-6
- **Status:** suggested

Preconditions:

- Fresh day: 5 free videos left

Steps:

1. Watch Free Coins 5 times
2. Look at the button

Expected:

- Coins +100 each time (+500 total)
- The card says '0 left today' and the Watch button is disabled

### TC-STORE-009

**Free Coins reset at the player's local midnight**

- **Type:** edge · **Technique:** state-transition · **Priority:** P3 (Time-based reset, low money impact)
- **Automation:** ui, CI stage nightly. Playwright can fake the clock
- **Source:** R-STORE-6 (dayKey uses local time, js/app.js:302)
- **Status:** suggested

Preconditions:

- 0 free videos left today

Steps:

1. Move the device clock to the next local day (or the browser clock in the test)
2. Open the Store

Expected:

- The card says '5 left today' and Watch is enabled

### TC-STORE-010

**Restore purchases says No Ads is active when owned**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P3 (Test-mode message only in this build)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-STORE-7
- **Status:** suggested

Preconditions:

- No Ads owned

Steps:

1. Open Settings or the Store
2. Tap Restore

Expected:

- Toast 'No Ads is already active'

### TC-STORE-011

**Double tap on a coin pack charges once**

- **Type:** edge · **Technique:** error-guessing · **Priority:** P2 (Double charges are a classic store bug)
- **Automation:** manual, CI stage release. Decide first whether two quick taps should mean two purchases (Q-02)
- **Source:** error-guessing: buy() has no pending guard (js/app.js:374-394)
- **Assumption:** Each tap is a separate purchase today; a confirm step may be wanted (Q-02)
- **Status:** suggested

Preconditions:

- 100 gems, 0 coins

Steps:

1. Double tap the 1,000 coins pack quickly

Expected:

- Either one purchase (gems 70, coins 1,000) or two clearly confirmed purchases (gems 40, coins 2,000); never a charge without the coins

## Boosters and slots (F-BOOST)

Risk: **high**. Boosters decide whether a level can be won; they are bought with currency. Source: js/app.js:1125-1130 (BOOSTERS); js/app.js:2112-2132 (useBooster); js/app.js:2681 (fail-addslot).

Rules found:

- **R-BOOST-1** Unlock levels: Add Slot at 0, Shuffle at 11, Wind at 14, Free Pick at 16 completed levels *(js/app.js:1126-1129)*
- **R-BOOST-2** Using a booster with none left: toast 'No <name> left' *(js/app.js:2120)*
- **R-BOOST-3** Add Slot stops at 7 slots: toast 'Maximum slots reached' *(js/app.js:2122)*
- **R-BOOST-4** Out of Slots offers +1 slot after a video ad (fail-addslot); this path has no slot check *(js/app.js:2681)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-BOOST-001](#tc-boost-001) | Add Slot adds one slot and uses one booster | happy | P1 | ui · pr | suggested |
| [TC-BOOST-002](#tc-boost-002) | Add Slot at 7 slots is refused and does not use a booster | edge | P1 | ui · pr | suggested |
| [TC-BOOST-003](#tc-boost-003) | +1 slot from Out of Slots respects the same 7-slot limit | edge | P2 | ui · pr | suggested |
| [TC-BOOST-004](#tc-boost-004) | Using a booster with none left shows 'No <name> left' | negative | P2 | ui · pr | suggested |
| [TC-BOOST-005](#tc-boost-005) | Shuffle unlocks at exactly 11 completed levels | edge | P2 | ui · nightly | suggested |
| [TC-BOOST-006](#tc-boost-006) | Tapping a locked booster says when it unlocks | negative | P3 | ui · nightly | suggested |

### TC-BOOST-001

**Add Slot adds one slot and uses one booster**

- **Type:** happy · **Technique:** use-case · **Priority:** P1 (Main booster)
- **Automation:** ui, CI stage pr. Core booster
- **Source:** R-BOOST-3 (js/app.js:2123)
- **Status:** suggested

Preconditions:

- In a level with the default slots, 1 Add Slot booster

Steps:

1. Tap Add Slot

Expected:

- One more slot appears
- Toast '+1 slot'
- Add Slot count drops by 1

### TC-BOOST-002

**Add Slot at 7 slots is refused and does not use a booster**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P1 (Limit that keeps levels fair)
- **Automation:** ui, CI stage pr. Boundary from the code
- **Source:** R-BOOST-3
- **Status:** suggested

Preconditions:

- In a level, 7 slots already (add slots until 7), at least 1 Add Slot left

Steps:

1. Tap Add Slot

Expected:

- Toast 'Maximum slots reached'
- Still 7 slots
- Add Slot count unchanged

### TC-BOOST-003

**+1 slot from Out of Slots respects the same 7-slot limit**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Two paths to one limit should agree)
- **Automation:** ui, CI stage pr. Same boundary as TC-BOOST-002 on the other path
- **Source:** R-BOOST-4: js/app.js:2681 pushes a slot without the check at js/app.js:2122
- **Assumption:** 7 is the limit for every path (Q-03)
- **Status:** suggested

Preconditions:

- In a level with 7 slots, run out of slots (debug: lose)

Steps:

1. On Out of Slots, tap the +1 slot option
2. Watch the test ad

Expected:

- No eighth slot is added, or the option is not offered at 7

### TC-BOOST-004

**Using a booster with none left shows 'No <name> left'**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Must not work for free)
- **Automation:** ui, CI stage pr. Cheap
- **Source:** R-BOOST-2
- **Status:** suggested

Preconditions:

- In a level, 0 Shuffle boosters, Shuffle unlocked

Steps:

1. Tap Shuffle

Expected:

- Toast 'No Shuffle left'
- The line of blocks does not change

### TC-BOOST-005

**Shuffle unlocks at exactly 11 completed levels**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Unlock boundary)
- **Automation:** ui, CI stage nightly. Boundary; reachable with the debug win cheat (assisted)
- **Source:** R-BOOST-1 (js/app.js:1127, js/app.js:2199)
- **Status:** suggested

Preconditions:

- 10 levels completed, then 11

Steps:

1. With 10 levels completed, start a level and look at Shuffle
2. Complete one more level
3. Start a level and look at Shuffle

Expected:

- At 10: Shuffle is shown locked
- On the 11th win: 'New Booster!' pop-up for Shuffle
- At 11: Shuffle is usable

### TC-BOOST-006

**Tapping a locked booster says when it unlocks**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P3 (Information only)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** js/app.js:2664 (booster-locked: unlockAt + 1)
- **Status:** suggested

Preconditions:

- Fewer than 14 levels completed

Steps:

1. In a level, tap the locked Wind booster

Expected:

- Toast 'Wind unlocks at level 15'
- No booster is used

## Level Complete and rewards (F-WIN)

Risk: **high**. The reward for every win; ads shown between wins. Source: js/app.js:1123 (WIN_COINS); js/app.js:2175-2210 (showWin, finishWin); index.html:423-440 (popup-complete).

Rules found:

- **R-WIN-1** Win reward: 30 coins easy, 45 medium, 60 hard *(js/app.js:1123)*
- **R-WIN-2** Claim x2 doubles the reward after a video ad; Continue pays it once *(js/app.js:2195-2197, js/app.js:2679-2680, index.html:436-437)*
- **R-WIN-3** A video ad every 2 wins in a row, unless No Ads is owned or Claim x2 was used *(js/app.js:2207-2209)*
- **R-WIN-4** Pop-ups marked data-locked close only by code; Out of Slots has it, Level Complete does not. A tap on the dark overlay closes an unlocked pop-up *(js/app.js:229-232, js/app.js:3028, index.html:423 vs index.html:458)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-WIN-001](#tc-win-001) | Continue on Level Complete pays the difficulty reward once | happy | P1 | ui · push | suggested |
| [TC-WIN-002](#tc-win-002) | Claim x2 pays double after the video | happy | P1 | ui · pr | suggested |
| [TC-WIN-003](#tc-win-003) | Tapping outside Level Complete does not lose the reward | negative | P1 | ui · pr | suggested |
| [TC-WIN-004](#tc-win-004) | A video ad plays after every second win in a row | happy | P2 | ui · nightly | suggested |
| [TC-WIN-005](#tc-win-005) | No ad between wins when No Ads is owned | negative | P1 | ui · pr | suggested |
| [TC-WIN-006](#tc-win-006) | Claim x2 does not count toward the next forced ad | edge | P3 | ui · nightly | suggested |

### TC-WIN-001

**Continue on Level Complete pays the difficulty reward once**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P1 (The reward for every level)
- **Automation:** ui, CI stage push. Data-driven over three difficulties; win with the debug cheat (assisted)
- **Source:** R-WIN-1
- **Status:** suggested

Preconditions:

- 0 coins, in an easy level

Test data: easy 30, medium 45, hard 60

Steps:

1. Win the level
2. Tap Continue

Expected:

- Level Complete shows '+30'
- Coins 0 -> 30 in the HUD and the save
- Same for medium (+45) and hard (+60)

### TC-WIN-002

**Claim x2 pays double after the video**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P1 (Reward tied to an ad view)
- **Automation:** ui, CI stage pr. Exact amount
- **Source:** R-WIN-2
- **Status:** suggested

Preconditions:

- 0 coins, in an easy level

Steps:

1. Win the level
2. Tap Claim x2
3. Finish the test ad

Expected:

- Coins 0 -> 60

### TC-WIN-003

**Tapping outside Level Complete does not lose the reward**

- **Type:** negative · **Technique:** state-transition · **Priority:** P1 (A lost reward on every stray tap is a serious player-facing failure)
- **Automation:** ui, CI stage pr. One tap, exact check
- **Source:** R-WIN-4: popup-complete (index.html:423) has no data-locked, and an overlay tap closes it (js/app.js:3028) without calling finishWin
- **Assumption:** Level Complete must not close without paying (Q-04)
- **Status:** suggested

Preconditions:

- 0 coins, Level Complete open after a win

Steps:

1. Tap the dark area outside the Level Complete window

Expected:

- The pop-up stays open, or the reward is paid and the game moves on
- Coins are never left at 0 with the board empty

### TC-WIN-004

**A video ad plays after every second win in a row**

- **Type:** happy · **Technique:** state-transition · **Priority:** P2 (Ad frequency affects experience and revenue)
- **Automation:** ui, CI stage nightly. Counter rule, stable
- **Source:** R-WIN-3
- **Status:** suggested

Preconditions:

- No Ads not owned, 0 wins since the last ad

Steps:

1. Win a level and tap Continue
2. Win the next level and tap Continue

Expected:

- No ad after the first win
- A test ad after the second win, then the next level starts

### TC-WIN-005

**No ad between wins when No Ads is owned**

- **Type:** negative · **Technique:** decision-table · **Priority:** P1 (Paid entitlement)
- **Automation:** ui, CI stage pr. Protects a paid entitlement
- **Source:** R-WIN-3; R-STORE-5
- **Status:** suggested

Preconditions:

- No Ads owned

Steps:

1. Win two levels in a row with Continue

Expected:

- No video ad at any point
- No banner in the level

### TC-WIN-006

**Claim x2 does not count toward the next forced ad**

- **Type:** edge · **Technique:** decision-table · **Priority:** P3 (Edge of the ad rule)
- **Automation:** ui, CI stage nightly. Third column of the ad decision table
- **Source:** R-WIN-3 (mult === 1 condition, js/app.js:2209)
- **Status:** suggested

Preconditions:

- No Ads not owned, 1 win since the last ad

Steps:

1. Win a level
2. Tap Claim x2 and finish the ad

Expected:

- No second ad after the reward ad

## Player XP and level locks (F-XP)

Risk: **medium**. Avatars, skins and wardrobe items unlock at player levels. Source: js/app.js:10-12 (state); js/app.js:150-151, 575 (XP bar); js/app.js:578, 761, 816, 829 (level locks).

Rules found:

- **R-XP-1** New player: level 1, XP bar out of 2 *(js/app.js:10-12)*
- **R-XP-2** Items locked below a player level show 'Unlocks at player level <n>' *(js/app.js:816, js/app.js:829)*
- **R-XP-3** Only the debug menu changes playerLevel or xp; no gameplay code adds XP *(js/app.js:2611-2612; search for 'state.xp' finds no increment)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-XP-001](#tc-xp-001) | Winning levels raises player XP and level | happy | P1 | ui · pr | suggested |
| [TC-XP-002](#tc-xp-002) | A level-locked skin cannot be bought below its level | negative | P2 | ui · nightly | suggested |
| [TC-XP-003](#tc-xp-003) | A skin unlocks exactly at its player level | edge | P3 | ui · nightly | suggested |

### TC-XP-001

**Winning levels raises player XP and level**

- **Type:** happy · **Technique:** state-transition · **Priority:** P1 (Level-gated content can only unlock through XP)
- **Automation:** ui, CI stage pr. Reads playerLevel and xp from the save
- **Source:** R-XP-1, R-XP-2, R-XP-3: the bar and the locks exist, but no gameplay code adds XP
- **Assumption:** Wins should give XP; the amount is not written anywhere (Q-05)
- **Status:** suggested

Preconditions:

- Fresh save: level 1, XP 0/2

Steps:

1. Win 3 levels with Continue
2. Open the profile

Expected:

- The XP bar moves after each win
- The player reaches level 2 or higher, as the XP rule defines

### TC-XP-002

**A level-locked skin cannot be bought below its level**

- **Type:** negative · **Technique:** boundary-value · **Priority:** P2 (Locks must hold)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-XP-2 (js/app.js:829)
- **Status:** suggested

Preconditions:

- Player level 1, enough gems

Steps:

1. Open Skins
2. Tap a skin locked at a higher player level

Expected:

- Toast 'Unlocks at player level <n>'
- Gems unchanged, skin not owned

### TC-XP-003

**A skin unlocks exactly at its player level**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P3 (Boundary of a lock)
- **Automation:** ui, CI stage nightly. Boundary; uses the debug levelup (assisted)
- **Source:** R-XP-2 (state.playerLevel < s.level)
- **Status:** suggested

Preconditions:

- Player level n-1, then n (debug: levelup, assisted)

Steps:

1. At level n-1, tap the skin
2. Level up to n
3. Tap the skin

Expected:

- At n-1: locked message
- At n: the skin can be bought or equipped

## Player name (F-NAME)

Risk: **low**. Shown in the profile only. Source: https://heloisatorres1.github.io/pixel-swarm/ profile pop-up (inventory/inventory.md: name-input maxlength=14).

Rules found:

- **R-NAME-1** The name field accepts up to 14 characters *(inventory/inventory.md: name-input maxlength=14)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-NAME-001](#tc-name-001) | A 14-character name is saved in full | happy | P3 | ui · nightly | suggested |
| [TC-NAME-002](#tc-name-002) | A 15th character cannot be typed | edge | P3 | ui · nightly | suggested |
| [TC-NAME-003](#tc-name-003) | An empty or spaces-only name falls back to a default | negative | P3 | manual · release | suggested |

### TC-NAME-001

**A 14-character name is saved in full**

- **Type:** happy · **Technique:** boundary-value · **Priority:** P3 (Profile cosmetics)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-NAME-1
- **Status:** suggested

Preconditions:

- Profile open

Test data: Abcdefghijklmn (14)

Steps:

1. Type the name
2. Close the profile
3. Reload

Expected:

- The name 'Abcdefghijklmn' shows in the profile after reload

### TC-NAME-002

**A 15th character cannot be typed**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P3 (Profile cosmetics)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-NAME-1
- **Status:** suggested

Preconditions:

- Profile open

Test data: Abcdefghijklmno (15)

Steps:

1. Type 15 characters

Expected:

- The field holds 'Abcdefghijklmn' (14)

### TC-NAME-003

**An empty or spaces-only name falls back to a default**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P3 (Profile cosmetics)
- **Automation:** manual, CI stage release. Rule not written; check by hand first (Q-06)
- **Source:** web-checklist.md forms: empty and spaces only
- **Assumption:** A default name is expected (Q-06)
- **Status:** suggested

Preconditions:

- Profile open with a name set

Steps:

1. Delete the whole name, or type only spaces
2. Close the profile and reopen it

Expected:

- A default name is shown, never an empty label

## Release build (F-BUILD)

Risk: **high**. The debug menu gives free currency; it must not ship. Source: js/app.js:80 (const DEBUG = true); scripts/build.mjs:23, 33.

Rules found:

- **R-BUILD-1** The build script sets DEBUG to false for a release build; the DBG button is hidden when DEBUG is false *(scripts/build.mjs:23, js/app.js:3132)*

Gaps: One build switch: a happy case and a negative case cover it; no edge input.

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-BUILD-001](#tc-build-001) | The release build has no DBG button | happy | P1 | ui · release | suggested |
| [TC-BUILD-002](#tc-build-002) | Debug cheats do nothing in the release build | negative | P1 | ui · release | suggested |

### TC-BUILD-001

**The release build has no DBG button**

- **Type:** happy · **Technique:** checklist · **Priority:** P1 (The debug menu gives free coins, gems and wins)
- **Automation:** ui, CI stage release. Must block every release
- **Source:** R-BUILD-1
- **Status:** suggested

Preconditions:

- A release build (npm run build) served locally

Steps:

1. Open the release build
2. Look for the pink DBG button

Expected:

- No DBG button
- Console says 'release build'

### TC-BUILD-002

**Debug cheats do nothing in the release build**

- **Type:** negative · **Technique:** checklist · **Priority:** P1 (Free currency in a store release)
- **Automation:** ui, CI stage release. Release gate
- **Source:** R-BUILD-1; js/app.js:3197 (DEBUG-only localStorage flag)
- **Status:** suggested

Preconditions:

- A release build served locally

Steps:

1. Try to open the debug pop-up (keyboard shortcut or URL flag, if any)
2. Try the debug localStorage flags

Expected:

- No debug pop-up opens
- Coins and gems unchanged

## Not covered

| Area | Reason |
|---|---|
| Puzzle rules, level solvability, save system, daily rewards, events, settings, UI layout | Outside this run's scope. The test-puzzles, test-progression, test-settings and test-ui skills cover them |
| Real-money purchases | This build uses test purchases; the store integration of the phone app is not built yet |
| Unit tests | The rules live inside one closure in js/app.js and cannot be imported; see the automation plan |
