# Pixel Swarm v1.0.0: full QA pass summary

**Verdict: Not ready for a store release. Fine as a public web demo.**
Three major bugs hit players directly (a lost reward, unreachable buttons on common phones, an owned item sold again). Each fix is small and local.

Build: v1.0.0 debug (commit db96df5) · Web, Edge headless, phone 390x844 plus 5 other sizes · 2026-11-16 · `test-game-full`, standard depth

## Confirmed issues

| Severity | Count |
|---|---|
| Blocker / critical | 0 |
| Major | 3 |
| Minor | 6 (3 bugs, 3 text) |
| Trivial | 5 (1 bug, 4 text) |
| Queries | 4 |

## Top risks

1. **BUG-001 (major): reward lost.** Tapping outside Level Complete (or Escape) closes it: the coins are never paid and the player is left on an empty board. Fix: add `data-locked` to `#popup-complete`. Reproduced 4/4 in each of three sessions (12/12).
2. **BUG-002 (major): controls off screen on 360 px phones.** The top bar pushes the Settings gear and the store's Close button off screen, fully from 9,999 coins. 360 px is one of the most common Android widths.
3. **BUG-003 (major): owned item sold again.** The $4.99 Special Offer, which includes No Ads, is still sold to players who own No Ads. With real payments this becomes a refund and store-policy risk.
4. **BUG-004 (minor): no slot limit on the fail popup.** Add Slot from Out of Slots ignores the 7-slot limit; the board fills with squeezed slots.
5. **TXT-001 / TXT-002 (minor): text.** "bees" vs "bugs" terminology; tutorial dots drawn over the ad banner text.

## What passed (highlights)

- Smoke gate: clean install to the age gate in 3.5 s, full first-launch flow, 0 script errors.
- All **102 levels** pass the solution check; all **10 puzzle mechanics** were won in the real game.
- Store prices and balances are exact in every purchase; refusals, Free Coins limit, skins and Speed Store correct.
- 7-day daily rewards, tasks, unlock boundaries and backup-save recovery correct.
- Settings apply and persist; "Sounds off" proven silent through the audio engine.
- Performance on the test machine: 1% low 58 fps even at 4x CPU throttle; memory stable in 200 s.

## Not tested (and why)

- Real in-app purchases, real ads, notifications, haptics: need the Android build on a device.
- Frame rate and memory on real phones: numbers above come from a desktop machine.
- Full playthrough of all 102 levels by hand: `complete` depth, not run (solvability covered by the verifier).
- Fun, feel, audio mix: human judgement.

## Suggested next steps

1. Fix BUG-001, BUG-002, BUG-003 (each is a few lines), then re-run `ONLY=PR-W2 node scripts/progression.mjs`, `ONLY=UI-20 node scripts/ui.mjs`, `ONLY=ST-08 node scripts/store.mjs`.
2. Batch the text fixes from the text review (suggested wording is in each finding).
3. Before the store release: real-device performance run (the game's 10-minute benchmark), IAP sandbox, notification delivery.
