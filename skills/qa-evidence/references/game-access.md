# Reaching the game: access modes

Work out the access mode before testing. Ask the user only for what you cannot find yourself (build location, credentials for a test account, debug flags).

## Recon checklist

- [ ] What is the game? Read the README, design docs, store page text, `package.json` / project file.
- [ ] Which engine or framework? Look for `ProjectSettings/` (Unity), `project.godot` (Godot), `*.uproject` (Unreal), `package.json` with phaser / pixi / three / kaplay (web), `*.rpy` (Ren'Py), `conf.lua` (LÖVE), `*.yyp` (GameMaker), or plain HTML/JS.
- [ ] Where is the playable build? URL, `dist/` folder, `.exe`, `.apk`, editor play mode.
- [ ] Which version or commit? Record it in `run.build`. Use `git rev-parse --short HEAD` when you have the source.
- [ ] Is there a debug menu, cheat console, level-select unlock or URL flag (`?debug=1`)?
- [ ] Where is the save data? `localStorage`/IndexedDB, `PlayerPrefs`, `user://` (Godot), `%APPDATA%`/`%LOCALAPPDATA%`, `Saved/` (Unreal), app sandbox on mobile.
- [ ] Where are the logs? Browser console, `Player.log` (Unity), `user://logs` (Godot), `Saved/Logs` (Unreal), `logcat`.

## Web builds

Best evidence quality. Prefer a Playwright script you write in the run folder, because it is repeatable: the same script reproduces the bug for the developer. Start from `../scripts/web-harness.mjs` (copy it into `qa-reports/<run>/scripts/`): clean profiles, console capture, save seeding, video without ffmpeg, crash-safe results and `ONLY=` re-runs.

### Known traps (each one produced a false result in a real run)

| Trap | What happens | Do this |
|---|---|---|
| Hash-only navigation | `goto(url#b)` from `url#a` changes the hash; the game does not restart, so you test the old screen | Go to `about:blank` first (the harness `open()` does) |
| Fixed sleeps vs loading screens | A screenshot taken mid-fade looks like "nothing opened" | Wait for a condition (loading element removed, popup visible) |
| Seeding a save from inside the game | The game writes its in-memory state on `pagehide` and overwrites your seed | Write the save from another same-origin URL (`seed()`) |
| Pulsing / animated buttons | Playwright waits for the element to be "stable" forever | `click({ force: true })` on that button, and note it |
| Frozen fake clock (`clock.setFixedTime`) | Timers that measure elapsed time never finish (stuck loading screen) | Edit the date in the save, or `clock.install` + `resume` |
| Counters that mix things | "Sounds played" also counted music steps | Read the code behind every counter you assert on |
| Headless frame rate | Headless Chromium is not capped at 60 Hz (100+ fps) | Judge 1% lows, hitches and trends, not the average against 60 |
| Parallel browsers | Other test runs steal CPU and distort timing | Run performance tests alone |
| A crash mid-script | All results of the run are lost | Write each result as soon as it is known (`makeCheck`) |

```js
// qa-reports/<run>/scripts/session.mjs  (npm i -D playwright, then: npx playwright install chromium)
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const log = [];
page.on('console', m => log.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
await page.goto(process.argv[2]);
await page.screenshot({ path: 'evidence/01-title.png' });
const save = await page.evaluate(() => JSON.stringify(localStorage));
// ... steps ...
await import('node:fs').then(fs => fs.writeFileSync('evidence/console.log', log.join('\n')));
await browser.close();
```

- **Canvas games**: elements are not in the DOM. Click by coordinates relative to the canvas, wait for frames (`page.waitForTimeout` small steps), and confirm state through screenshots or exposed globals.
- **Read state** through globals the game already exposes (`window.game`, a debug object) rather than guessing from pixels.
- **Throttling**: `page.emulateCPUThrottling` is not available in all versions; use a CDP session (`Emulation.setCPUThrottlingRate`) for slow-device checks.
- If the user prefers their own browser, use Claude in Chrome or the built-in browser and take screenshots there. Note this in `run.access_mode`.

## Desktop builds

- Use computer use for screenshots, clicks and keys. Take a screenshot after every meaningful action; they are your evidence trail.
- Find the log file and tail it before and after each test step.
- Save files: copy the save folder to `evidence/save-backup/` before the run and restore it at the end.

## Mobile

- Android: `adb install`, `adb exec-out screencap -p > evidence/x.png`, `adb shell screenrecord /sdcard/x.mp4` (pull afterwards), `adb logcat -d > evidence/logcat.txt`, `adb shell input tap X Y`.
- Clear state between runs: `adb shell pm clear <package>`.
- iOS simulator: `xcrun simctl io booted screenshot evidence/x.png`.

## Engine hooks

| Engine | What to use |
|---|---|
| Unity | Unity Test Framework play-mode tests (`-runTests -batchmode -testPlatform PlayMode`), AltTester for driving builds, `Player.log` |
| Godot | `godot --headless --script` for logic checks, GUT tests, `--write-movie` for frame capture, `user://logs/godot.log` |
| Unreal | Automation tests (`-ExecCmds="Automation RunTests ..."`), Gauntlet, `Saved/Logs/*.log` |
| Web frameworks | The game object in the browser console (`window.game` for Phaser, the app instance for Pixi) |

Only add test code to the project if the user agrees. Keep it in a separate folder you can remove.

## Source / data only

When there is no runnable build, you can still test content: level data, string tables, prices, reward tables, unlock rules. Every finding then points at `file:line`. Mark runtime areas `NOT_TESTED` with the reason "no runnable build".
