# Test plan: Pixel Swarm v1.0.0 (debug build, commit db96df5)

Skill: `test-game-full`, depth **standard** (all modules except full-playthrough).
Platform: web build served locally, Microsoft Edge (Chromium) driven by Playwright. Main viewport 390x844 (phone), plus UI sizes in `test-ui`.
Access: Playwright scripts in `scripts/` + save reads from `localStorage` (`pixelswarm.save.v1`) + the game's own test hooks (auto-solve bot, `#pzsolve_*`, level verifier, perf benchmark). Anything finished with those hooks is labelled **assisted**.
Evidence: screenshots, close-up crops, **video of every runtime bug reproduction**, save-state JSON before/after.

## Re-running any check

```bash
# in the Pixel Swarm repo: PORT=5199 node scripts/dev-server.mjs
npm i playwright-core                       # once, in this folder
node scripts/store.mjs                      # a whole module
ONLY=ST-08 node scripts/store.mjs           # one check (results merge by id)
node ../../skills/qa-evidence/scripts/build-report.mjs smoke/findings.json ../pixel-swarm-text-review/findings.json test-*/findings.json catalog/findings.json --out .
```

## Detected features

| # | Feature | Present? | Proof of presence | Covered by | Capability | In scope |
|---|---|---|---|---|---|---|
| 1 | Boot / first launch (age gate, story, welcome) | yes | index.html:200, 13, 485 | smoke | Full | yes |
| 2 | Player-facing text | yes | 861 strings | text-review (run of 2026-11-16, merged) | Full | yes |
| 3 | UI: 13 popups, 6 screens, bottom nav | yes | index.html overlays 145-642 | test-ui | Full | yes |
| 4 | Settings: music, sounds, haptics, notifications, links, player id | yes | index.html:536-575, app.js:240-270 | test-settings | Partial (audio heard by a human) | yes |
| 5 | Puzzles: 90 theme levels + 12 event levels, 10 mechanics, 4 boosters | yes | js/pictures.js:378, app.js PUZZLE_ORDER, BOOSTERS | test-puzzles | Full | yes |
| 6 | Store: offer, No Ads, bundle, gem packs, coin packs, free coins, speed store, skins | yes | app.js:59-75, 709-835, 1790-1825 | test-store | Partial (test purchases only, no real IAP) | yes |
| 7 | Progression: levels/stars, difficulty unlocks, player level, gallery | yes | app.js:841-860, 921-939 | test-progression | Full | yes |
| 8 | Daily rewards (7-day), daily tasks, Halloween event + reward track | yes | app.js:47-55, 455-535, 1060-1120 | test-progression | Full (time simulated) | yes |
| 9 | Save / backup slot / save codes | yes | app.js:87-125 | test-progression | Full | yes |
| 10 | Tutorial (6 steps) + New Feature cards | yes | app.js:2248-2290 | catalog: tutorial | Full | yes |
| 11 | Ads (simulated): rewarded ad slot, x2 claim, interstitial every 2 wins | yes | app.js:415-440, 2210 | catalog: ads | Partial (no real ad SDK) | yes |
| 12 | Lifecycle: save on hide/pagehide, pause | yes | app.js:3184-3186 | catalog: lifecycle | Full | yes |
| 13 | Notifications (Android only) | yes | js/native.js | catalog: notifications | Manual (needs device) | NOT_TESTED |
| 14 | Performance tooling (overlay, benchmark, stress) | yes | js/perf.js | test-performance | Partial (test machine only) | yes |
| 15 | Accessibility basics (contrast, touch targets, colour-only info) | yes | - | catalog: accessibility | Partial | yes |
| 16 | Legal / age gate | yes | index.html:200-216 | catalog: legal | Partial | yes |
| 17 | Multiplayer / accounts / cloud save | no | no network code | - | - | n/a |
| 18 | Full playthrough of all 102 levels | yes | - | full-playthrough | Full | no (standard depth) |

## Module status

| Module | Status | Folder |
|---|---|---|
| smoke | done: 5/5 checks, gate passed | smoke/ |
| text-review | done (same build, run earlier today; merged) | ../pixel-swarm-text-review |
| test-ui | done: BUG-002, BUG-005 | test-ui/ |
| test-settings | done: 7/7 | test-settings/ |
| test-puzzles | done: 102/102 levels solvable, 10/10 mechanics; BUG-004 | test-puzzles/ |
| test-store | done: 13/15; BUG-003 | test-store/ |
| test-progression | done: 11/12 areas; BUG-001 | test-progression/ |
| catalog checklists | done: tutorial, ads, lifecycle pass; BUG-006 | catalog/ |
| test-performance | done | test-performance/ |

## Script mistakes caught during triage (not game bugs)

Every automated FAIL was reviewed before it became a finding. These were mine, fixed and re-run:

- "Sounds off still plays effects": the audio counter also counts music steps; effects alone were 0.
- "No age gate after a corrupted save": screenshot taken while the loading screen was fading.
- "Medium never unlocks": the script read the wrong element.
- "Next-day claim never loads": a frozen fake clock stalls the loading screen; replaced by editing the save date.
- "Buttons covered" in the game screen: lower queue rows sit behind the booster bar by design.
- Hash-only navigation did not reload the game, so one probe measured the previous screen.
