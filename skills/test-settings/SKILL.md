---
name: test-settings
description: Tests a game's settings and options in any engine - every toggle, slider and dropdown applies its effect, persists after restart, has a correct default and survives reset; covers audio volume/mute, language switching, graphics/quality, controls and rebinding, notifications, accessibility options, account/privacy links and data reset. Proves each with state reads and screenshots. Use when the user asks to test settings, options, preferences, audio toggles or language switching.
argument-hint: "[build URL or path]"
---

# Test Settings

Load the shared standard first: read `../qa-evidence/SKILL.md`. Under `test-game-full`, write to `<run>/test-settings/`.

## 1. Inventory

List every option in `settings.md`: name, location, control type, possible values, default (from code/data), where it is stored, and what it should change. Include options outside the settings screen (in-game pause menu, first-launch prompts).

## 2. Test cases (per option)

- [ ] SE-01 Default value on a fresh save matches the code/data default and the UI shows it correctly
- [ ] SE-02 Changing the value applies the effect **immediately** (or as designed, e.g. after restart), checked through state, not only through the control's look
- [ ] SE-03 The value persists after a reload/restart
- [ ] SE-04 The UI control shows the stored value after reload (toggle not visually "on" while the setting is off)
- [ ] SE-05 Extreme values: slider at 0 and max, rapid toggling
- [ ] SE-06 Changing it during gameplay (from the pause menu) applies without breaking the level

**Specific options**
- Audio: volume/mute must change the real gain or the audio element volume (`audio.volume`, mixer value, `AudioListener.volume`). Claude cannot hear; check values and that sounds stop/start. Listening quality is manual.
- Language: every screen switches; no strings left in the old language; layout still fits; the choice persists. Hand text problems to `text-review`.
- Graphics/quality/FPS cap: the engine setting really changes (read it back), performance difference noted (deep checks in `test-performance`).
- Controls/rebinding: new binding works, old one does not, conflicts handled, reset restores defaults.
- Notifications: toggling off cancels scheduled notifications (check the scheduler state).
- Links (privacy, terms, support): open the right target; failure handled.
- Reset progress / delete data: asks for confirmation; really deletes what it says and nothing else; the game is in a clean state afterwards (test on a backed-up save).
- Player id / version display: shown values match the build and save.

## 3. Evidence pattern

For each option: `SE-03-<option>-before.png`, `SE-03-<option>-after-reload.png`, and a state read (`SE-03-<option>-state.json`) with the stored value before/after.

## 4. Report

Coverage: one area per option group (`Audio`, `Language`, `Graphics`, `Controls`, `Notifications`, `Links`, `Data reset`). Restore the original save, then build:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-settings/findings.json
```

## Done when
- [ ] Every option in `settings.md` has SE-01 to SE-04 results.
- [ ] Audio checks state what was verified through values and what needs a human ear.
