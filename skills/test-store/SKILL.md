---
name: test-store
description: Tests a game's store and economy, engine-agnostic - prices vs data, currency deduction and grants, insufficient funds, double purchases, ownership, restore purchases, no-ads, bundles, offers and timers, rewarded ads, plus economy sources and sinks. Proves every result with before/after state reads and screenshots. Never makes real-money purchases. Use when the user asks to test the shop, store, IAP, currency, economy or purchases.
argument-hint: "[build URL or path]"
---

# Test Store

Load the shared standard first: read `../qa-evidence/SKILL.md`. If `test-game-full` called you, reuse its access details and write to `<run>/test-store/`.

**Safety:** never complete a real-money purchase. Use test/sandbox modes, debug purchases or mocked stores only. If the only path is real money, mark those checks `NOT_TESTED` (reason: real payment required).

## 1. Map the store

1. Find every place that sells or grants something: store screen, offers/popups, in-level purchases (boosters, continues), skins, battle passes, rewarded ads, free/daily gifts.
2. Find the **source of truth** for prices and contents (data tables, product configs, remote config). Build `catalog.md`:

| Product | Where shown | Price (data) | Price (UI) | Gives (data) | Gives (UI text) | Type |
|---|---|---|---|---|---|---|

Mismatches between data and UI are findings already (screenshot + `file:line`).

3. Find how to **read balances and ownership** reliably: state object, save file, `localStorage`, debug overlay. Reading numbers from state is the primary proof; screenshots support it.

## 2. Test cases

Run each with a known starting balance. Record `before` and `after` state for every purchase.

**Purchase flow (each product)**
- [ ] ST-01 Buy with exactly enough currency: balance becomes 0, item granted once
- [ ] ST-02 Buy with more than enough: balance drops by exactly the price
- [ ] ST-03 Buy with not enough: blocked, clear message, nothing deducted, path to get more currency (if designed)
- [ ] ST-04 Item appears where it should (inventory, equipped, counter) and works when used
- [ ] ST-05 Confirmation shows correct price and contents before charging (if a confirm step exists)

**Abuse and edge cases**
- [ ] ST-06 Double-click / rapid tap on Buy: charged once
- [ ] ST-07 Buy, then reload immediately: purchase and balance persisted, not rolled back, not duplicated
- [ ] ST-08 Buy an owned one-time item again: blocked or clearly handled
- [ ] ST-08b **Bundles that contain a one-time item** (No Ads, a skin, a pass) are hidden, re-priced or clearly marked once that item is owned, in every place they are sold (store card, popup offer, level-end offer). Check each place, because they are often coded separately
- [ ] ST-09 Close the store during a purchase / background the app mid-purchase
- [ ] ST-10 Balance display updates everywhere (header, store, popups) without reopening screens
- [ ] ST-11 Large numbers: formatting and no overflow at high balances (use a debug grant)
- [ ] ST-12 Offers with timers: countdown correct, offer disappears or changes at expiry, cannot be bought after expiry

**IAP-like flows (test/sandbox only)**
- [ ] ST-13 Purchase success grants exactly the bundle contents
- [ ] ST-14 Purchase cancelled / failed grants nothing and shows a sensible message
- [ ] ST-15 Restore purchases restores non-consumables (no-ads, permanent unlocks) on a fresh save
- [ ] ST-16 No-ads removes banner/interstitial ads and keeps rewarded ads only if that is the design

**Free sources and ads**
- [ ] ST-17 Rewarded ad grants the reward once, only when completed; early close gives nothing
- [ ] ST-18 Daily/free gifts respect their limits (count, cooldown), see `test-progression` for clock tests
- [ ] ST-19 Ad unavailable/offline: no crash, no reward, clear message

**Economy sanity**
- [ ] ST-20 List sources (level rewards, gifts, ads) and sinks (store, boosters, continues). Note anything that is impossible to afford through normal play or trivially farmable. Balance opinions are `type: query`, not bugs.

## 3. Evidence pattern

For each purchase test: `ST-02-1-before.png`, `ST-02-2-confirm.png`, `ST-02-3-after.png`, plus `ST-02-state.json` with `{ "before": {...}, "after": {...}, "expected_delta": {...}, "actual_delta": {...} }`. The delta object is what makes the result undeniable.

## 4. Report

Coverage areas: `Catalog vs data`, `Purchase flow`, `Edge cases`, `IAP / restore`, `Ads & free sources`, `Economy`. Restore the original save, then build the report:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-store/findings.json
```

## Done when
- [ ] Every product in `catalog.md` was bought at least once (or has a reason it was not).
- [ ] Every purchase result has a before/after state delta.
- [ ] No real money was spent.
