# Feature catalog

Everything `test-game-full` knows how to test, which skill covers it, and how far an AI agent can really go. Use it to build the test plan and to be honest about limits.

**Capability**
- **Full**: Claude can test it end to end with proof.
- **Partial**: Claude can test the logic and visible behaviour, but part of it needs a human or real hardware (stated in the row).
- **Manual**: a human tester must do it. List it in the report as `NOT_TESTED` (reason: needs manual testing) so it is not forgotten.

## Covered by dedicated skills

| Feature | Skill | Capability | Main checks |
|---|---|---|---|
| Player-facing text, localisation | `text-review` | Full (Partial for text inside images) | Typos, grammar, consistency, placeholders, plurals, dev text, truncation |
| Complete all content end to end | `full-playthrough` | Full (time-boxed for very long games) | Every level/mode/ending reachable and completable, rewards and unlocks on the way |
| Puzzles, levels, core rules | `test-puzzles` | Full | Solvability, win/lose conditions, rule edge cases, undo/restart, scoring, difficulty data |
| Store, currency, IAP, ads purchase | `test-store` | Partial (no real payments, store sandbox only if provided) | Prices, balance changes, insufficient funds, double purchase, restore, ownership, no-ads |
| Save/load, progression, rewards, live ops | `test-progression` | Full on web/desktop, Partial on consoles | Persistence, unlocks, daily rewards, quests, achievements, events, timers, clock changes |
| UI, navigation, layout, resolutions | `test-ui` | Full | Every screen reachable and closable, layout at several sizes, states, overlaps, back navigation |
| Settings and options | `test-settings` | Partial (audio heard by a human) | Each option applies, persists, resets; language switch; graphics; controls |
| Performance and stability | `test-performance` | Partial (real devices and thermals are manual) | Load times, frame time, memory growth, long session, stress, errors |

## Covered by inline checklists (run inside `test-game-full`)

### Smoke / boot (Full)
See Phase 2 of `test-game-full`.

### Tutorial / onboarding / FTUE (Full)
- [ ] Shown on first launch with a fresh save, not shown again after completion
- [ ] Every step can be completed; no step can be skipped into a broken state
- [ ] Skip option (if any) leaves the game in a valid state
- [ ] Instructions match the real controls and rules
- [ ] Re-opening "How to play" later works
- [ ] Feature introductions (new mechanic popups) appear once, at the right moment

### Core gameplay, non-puzzle games (Partial: "feel" is manual)
- [ ] Win and lose conditions trigger correctly and only once
- [ ] Score/health/timer values change by the documented amounts (read state, not pixels)
- [ ] Restart/retry resets the level state completely
- [ ] Pause freezes timers, physics and input
- [ ] Edge inputs: spam clicks, holding keys, input during transitions
- Manual: game feel, difficulty fun, animation quality

### Input and controls (Partial)
- [ ] Every action has a working input on each supported device class (mouse, touch, keyboard)
- [ ] Rebinding (if any) works and persists
- [ ] No input leaks through popups to the board behind them
- [ ] Multi-touch / rapid input does not double-trigger
- Manual: physical gamepads, haptics, controller disconnect

### Audio (Partial: listening is manual)
- [ ] Music and SFX start (check audio elements / engine audio state, not your ears)
- [ ] Mute and volume settings change the real gain values and persist
- [ ] Audio stops when paused / backgrounded, resumes correctly
- [ ] No audio errors in the log (missing files, decode errors)
- Manual: mix, clipping, quality, lip sync

### Ads (Partial: real ad networks are manual)
- [ ] Rewarded ad grants the reward once, only after completion
- [ ] Closing the ad early grants nothing (if that is the rule)
- [ ] Interstitial frequency matches the design
- [ ] "No Ads" purchase removes ads and survives reload/restore
- [ ] Game works when the ad fails to load (offline, no fill)

### Notifications (Partial)
- [ ] Permission asked at a sensible moment, game works if denied
- [ ] Scheduled notification text and timing match the trigger
- Manual: real-device delivery and tap-to-open on each OS

### Lifecycle and interruptions (Full on web/mobile emulators)
- [ ] Pause on focus loss / tab hidden / app backgrounded
- [ ] Resume restores state; timers behave as designed (pause vs real time)
- [ ] Window resize / orientation change mid-game
- [ ] Offline start and connection lost mid-session (if the game uses network)
- [ ] Reload/close mid-level: what is kept, what is lost, matches the design

### Accessibility (Partial)
- [ ] Text contrast against backgrounds (measure, WCAG AA as a guide)
- [ ] Information not conveyed by colour alone (colour-blind safe palettes, symbols)
- [ ] Minimum touch target size (around 44 px on mobile)
- [ ] Text size options, subtitles, reduced motion (if offered) work
- Manual: screen readers on native platforms, comfort settings feel

### Legal and store compliance (Partial)
- [ ] Age gate / consent flow works and stores the answer
- [ ] Privacy policy and terms links open
- [ ] Purchases show price and what is bought before confirming
- [ ] Restore purchases exists where platforms require it
- Manual: platform certification (TRC/XR/lotcheck), legal review

### Security and cheat resistance (Partial)
- [ ] Editing client-side save data (currency, unlocks) is detected or harmless for an offline game; document what happens
- [ ] Debug menus and cheats are off in release builds
- [ ] No secrets (API keys, tokens) in shipped files
- Out of scope: penetration testing, server attacks

### Compatibility (Partial)
- [ ] Main supported browsers / OS versions launch and play (as available on the machine)
- [ ] Minimum and common resolutions / aspect ratios (shared with `test-ui`)
- Manual: real device matrix, GPUs, low-end hardware

### Accounts, cloud save, online features (Partial)
- [ ] Login/logout, guest to account upgrade, data kept
- [ ] Cloud save conflict handling (two devices) when it can be simulated
- [ ] Leaderboards submit and display the right values
- Manual: real multiplayer sessions with several humans, matchmaking load

## What Claude cannot judge (always list as manual)

Fun and game feel, difficulty satisfaction, art quality, audio quality and mix, haptics, real-money purchases, real-device performance and battery, platform certification, multiplayer with real players, physical accessibility hardware.
