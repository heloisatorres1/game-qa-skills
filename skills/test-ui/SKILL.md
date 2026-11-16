---
name: test-ui
description: Tests a game's user interface in any engine - builds a screen map, checks every screen is reachable and can be closed, navigation and back behaviour, button states, popups stacking, layout at several resolutions and aspect ratios (phone, tablet, desktop, ultrawide), safe areas, overlaps, clipping, scaling and readability. Every issue comes with a screenshot at the exact size. Use when the user asks to test UI, menus, layout, responsiveness, resolutions or navigation.
argument-hint: "[build URL or path] [sizes]"
---

# Test UI

Load the shared standard first: read `../qa-evidence/SKILL.md`. Under `test-game-full`, write to `<run>/test-ui/` and reuse the screen tour from recon.

## 1. Screen map

Walk the whole UI once and build `screens.md`: every screen and popup, how to open it, how to close it, and a screenshot (`evidence/screen-05-store.png`). Include rarely seen states: empty lists, max values, error messages, loading, offline, first-time and returning-player versions.

Cross-check against the code (screen/popup ids, scene list) so hidden screens are not missed.

## 2. Sizes to test

Default matrix (adapt to the platforms the game supports):

| Name | Size | Why |
|---|---|---|
| Small phone portrait | 360×640 | smallest common |
| Tall phone portrait | 390×844 | notch / tall ratio |
| Phone landscape | 844×390 | rotation |
| Tablet | 820×1180 | 4:3-ish |
| Laptop | 1280×720 | common desktop |
| Full HD | 1920×1080 | |
| Ultrawide | 2560×1080 | 21:9 |

For web builds, a Playwright loop over this matrix with a screenshot per screen gives a full grid quickly. Use `deviceScaleFactor: 2` for phones to catch blurry assets. For native builds, use the window sizes/emulators available and say which were not covered.

## 3. Test cases

**Navigation**
- [ ] UI-01 Every screen in `screens.md` can be opened from where the design says
- [ ] UI-02 Every screen/popup can be closed (close button, back button/Esc, tapping outside if designed); nothing traps the player
- [ ] UI-03 Back navigation returns to the right place; no duplicated screens on the stack
- [ ] UI-04 Two popups at once (reward popup + offer + tutorial): order is sensible, nothing hidden behind, input goes to the top one only
- [ ] UI-05 Rapid taps on navigation buttons do not open screens twice or break transitions
- [ ] UI-06 **Popups that carry a result or reward** (level complete, reward claim, purchase confirm) cannot be closed by a tap outside, Escape or the Back button unless closing also resolves them. Build a lock map: which popups are dismissible, which are locked, and check each dismissible one has nothing to lose

**Layout (each size)**
- [ ] UI-10 Nothing cut off or outside the screen; safe areas respected on notched phones
- [ ] UI-11 No overlapping elements, no text overflowing its container
- [ ] UI-12 Touch targets big enough on phones (around 44 px)
- [ ] UI-13 Images/sprites not stretched or blurry; aspect ratio kept
- [ ] UI-14 Resizing / rotating while a screen is open re-lays it out correctly
- [ ] UI-15 **Worst-case values in fixed bars**: top bars and badges with the longest numbers the game can show. Test the boundary of the number formatter (e.g. 9,999 is often wider than 10K), long player names and 3-digit levels, on the narrowest phone (360 px)
- [ ] UI-16 **Every button is really tappable**: at the centre of each visible button, `document.elementFromPoint` must return the button itself (or a child). Anything else means it is covered. Then review each flag: content scrolled under a fixed bar or rows hidden by design are not bugs

**States and feedback**
- [ ] UI-20 Buttons show disabled/locked/selected states that match the real state
- [ ] UI-21 Counters and badges update live (currency, notifications) without reopening screens
- [ ] UI-22 Long values: large numbers, long names, longest translation (if localised)
- [ ] UI-23 Loading and error states exist and are not blank screens
- [ ] UI-24 Feedback on every action (sound/animation/toast) as designed

**Readability**
- [ ] UI-30 Text contrast on its background (measure on the screenshot if in doubt)
- [ ] UI-31 Colour is not the only way to tell important things apart

## 4. Evidence pattern

- Name screenshots with size and screen: `UI-11-360x640-store.png`.
- For layout bugs, include one size where it looks right as a comparison (`UI-11-1280x720-store-ok.png`).
- A contact sheet helps reviewers: an HTML page or image grid of all screens × sizes (optional, store it in `evidence/`).

## 5. Report

Coverage areas: `Screen map`, `Navigation`, one area per size (or size group), `States`, `Readability`. Build:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-ui/findings.json
```

## Done when
- [ ] `screens.md` lists every screen with a screenshot.
- [ ] Every screen was checked at every size in scope, or the gap is in coverage notes.
- [ ] Every layout finding names the exact size.
