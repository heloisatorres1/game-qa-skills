---
name: test-performance
description: Measures a game's performance and stability in any engine - boot and level load times, frame time and FPS (average, 1% low, hitches), memory growth over a long session, stress scenes, CPU-throttled runs, and errors or crashes in logs. Reports numbers with the method used, raw samples and charts, against budgets agreed with the user. Use when the user asks to test performance, FPS, lag, loading time, memory leaks or stability.
argument-hint: "[build URL or path] [budget e.g. 60fps, 3s load]"
---

# Test Performance

Load the shared standard first: read `../qa-evidence/SKILL.md`. Under `test-game-full`, write to `<run>/test-performance/`.

Performance claims need numbers, a method and raw data. "It felt smooth" is not a result. Results from Claude's machine are **indicative**; real target devices are a manual check, so say so in the report.

## 1. Budgets

Ask for or propose budgets and write them in `run.scope`, e.g.:

| Metric | Budget |
|---|---|
| Boot to interactive | ≤ 3 s (desktop), ≤ 5 s (4× CPU throttle) |
| Level load | ≤ 1 s |
| Average FPS during play | ≥ 58 (60 Hz target) |
| 1% low FPS | ≥ 45 |
| Hitches (> 50 ms frames) per minute | ≤ 2 |
| Memory growth over 15 min | ≤ 10% after warm-up, no steady climb |

## 2. How to measure

- **Web**: `performance.now()` around boot milestones; a `requestAnimationFrame` loop that records frame deltas; `performance.memory` (Chromium) or CDP `Performance.getMetrics` for JS heap; CDP `Emulation.setCPUThrottlingRate` for slow devices. Use the game's own profiler/overlay if it has one; record which.
- **Unity**: Profiler or `FrameTimingManager`, `Player.log`; **Godot**: `Performance.get_monitor` (FPS, memory, draw calls); **Unreal**: `stat unit`, `stat fps`, CSV profiler.
- **Desktop/mobile**: OS tools (Task Manager / `adb shell dumpsys meminfo` / `gfxinfo`).

Always: same scene, same duration, warm-up period discarded, at least **3 runs**, report median and spread. Run performance tests **alone** (no other browsers or test scripts), and use the game's own benchmark or autoplay if it has one: it plays the same content every time.

Headless browsers are not capped at 60 Hz, so averages of 100+ fps are normal there. Judge 1% lows, hitches per minute and memory trends, and say in the report that the numbers come from a headless run. Memory trends need runs of 3+ minutes.

## 3. Test cases

- [ ] PF-01 Boot time: cold start to interactive main menu (3 runs)
- [ ] PF-02 Level/scene load time for the lightest and the heaviest content
- [ ] PF-03 Frame time during normal play (60 s sample) on the heaviest level/scene
- [ ] PF-04 Stress: maximum on-screen entities/effects the game can produce in normal play
- [ ] PF-05 Throttled run (4× CPU, web) or lowest quality settings on low hardware
- [ ] PF-06 Long session: 15 to 30 minutes of looping play (auto-play/bot if available); sample memory every minute; look for steady growth
- [ ] PF-07 Repeated scene transitions (open/close store 50×, restart level 50×): memory returns to baseline
- [ ] PF-08 Errors: no exceptions, warnings floods or failed asset loads in the log during all of the above
- [ ] PF-09 Background/foreground: frame loop paused when hidden (CPU/battery), resumes cleanly

## 4. Evidence pattern

- Raw samples as CSV: `PF-03-frames.csv` (timestamp, frame_ms), `PF-06-memory.csv`.
- A summary JSON per test: `{ "runs": 3, "median_fps": 59.6, "p1_low_fps": 47, "hitches_per_min": 1.3, "method": "rAF deltas, Chrome 131, 1280x720" }`.
- A chart image of frame time and memory over time (render with a small HTML page + screenshot, or any plotting tool available). A chart makes a leak obvious at a glance.

A performance bug is `confirmed` when the budget is missed in at least 2 of 3 runs. Put the numbers in `actual`, the budget in `expected`.

## 5. Report

Coverage areas: `Boot`, `Loading`, `Frame rate`, `Stress`, `Low-end`, `Memory / long session`, `Stability`, and `Target devices` (`NOT_TESTED`, manual). Build:

```bash
node ../qa-evidence/scripts/build-report.mjs <run>/test-performance/findings.json
```

## Done when
- [ ] Every metric has budget, method, 3 runs and raw data.
- [ ] The report says clearly that numbers come from the test machine, not target devices.
