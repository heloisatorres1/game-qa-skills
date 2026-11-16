---
name: qa-evidence
description: Shared QA standard used by every skill in this pack - how to reach the game (browser, desktop, mobile, source, engine hooks), how to capture proof (screenshots, frame sequences, logs, save files, file:line references), the result statuses, the bug report format and the findings.json that turns into an HTML/Markdown report. Load it before running any other game-qa skill, or on its own when the user asks to document a bug with evidence or build a QA report.
---

# QA Evidence Standard

Every skill in this pack follows these rules. The point is simple: **a finding without proof is not a finding.** A reviewer must be able to open the report, look at the evidence and reproduce the problem without asking you anything.

## 1. Golden rules (reliability)

1. **Observe, don't assume.** Only mark something PASS after you watched it work (screenshot, log, state read-back). Reading the code and concluding "this should work" is not a pass; record it as `NOT_TESTED` with the note "code review only".
2. **Reproduce before you report.** A runtime bug is `confirmed` only after it happens at least **2 times from a clean state** (fresh load, or a restored save). Seen once and never again: report it as `type: observation`, `status: unconfirmed`, with the evidence you have.
3. **Static evidence is enough for static defects.** A typo in a string file, a wrong price in a data table or a missing level file is confirmed by the `file:line` reference itself. No need to replay it, but show it in-game too when you can.
4. **Separate fact from guess.** `actual` holds only what you saw. Anything about *why* goes in `suspected_cause`, worded as a hypothesis ("likely", "the code at X suggests").
5. **Never fabricate evidence.** No invented screenshots, log lines, file paths or repro rates. If a capture failed, say so in the finding.
6. **Record what you did not test.** Every area in scope ends with a status. `BLOCKED` and `NOT_TESTED` always carry a reason. An honest coverage table is worth more than a long bug list.
7. **Design questions are not bugs.** If behaviour looks intentional but odd, file it as `type: query` so the team can decide.
8. **Leave the game as you found it.** Back up save files before editing them, restore them after, and never touch real-money purchases, live accounts or production servers.
9. **Review every automated FAIL before filing it.** Scripts and probes produce false alarms: a counter that also counts music, a screenshot taken mid-fade, a "covered" button that sits behind a bar by design. Open the evidence, find the cause, and only then file a finding. Rejected flags go in the coverage `notes`, so readers see they were checked.
10. **Show it.** Every runtime bug carries at least one screenshot, video or frame sequence, even when a state dump already proves it. People trust what they can see. The report builder refuses a runtime bug without one unless `no_visual_reason` says why.

## 2. Result statuses

| Status | Meaning | Required |
|---|---|---|
| `PASS` | Checked and works as expected | at least one piece of evidence per area |
| `FAIL` | At least one confirmed bug in this area | linked finding IDs |
| `PARTIAL` | Some checks passed, some could not be run | which checks were skipped and why |
| `BLOCKED` | Could not test (crash, missing access, earlier blocker) | the reason and the blocking finding ID if any |
| `NOT_TESTED` | Out of scope, out of capability, or code review only | the reason |

## 3. Severity

| Severity | Use when |
|---|---|
| `blocker` | Game cannot be started or progression is impossible; data loss; crash on the main path |
| `critical` | Core feature broken with no workaround; currency/purchase lost; save corrupted |
| `major` | Feature broken but a workaround exists; wrong reward; soft-lock that a restart fixes |
| `minor` | Cosmetic or UX issue with clear impact (overlap, clipped text, wrong icon) |
| `trivial` | Polish (typo in a rarely seen string, 1px misalignment) |

## 4. How to reach the game

Pick the strongest access mode available and write it down in the run info. Details and commands per mode: [references/game-access.md](references/game-access.md).

| Mode | Typical tool | Evidence you can capture |
|---|---|---|
| Web build | Playwright script, Claude in Chrome, built-in browser | screenshots, video, console log, `localStorage`, network log, JS state |
| Desktop build | computer use | screenshots, frame sequences, log files in the user data folder |
| Mobile / emulator | `adb` (Android), simulator tools | `adb exec-out screencap`, `adb shell screenrecord`, `logcat` |
| Engine hooks | Unity (Test Framework, AltTester), Godot (headless + GUT), Unreal (Automation / Gauntlet) | test output, logs, screenshots taken by the engine |
| Source / data only | file reading | `file:line` references, data tables, extracted strings |

Always check for a **debug menu, cheat console or URL flags** first (look for `debug`, `cheat`, `dev`, `DBG` in the code and ask the user). They make long tests possible, but anything achieved with them is labelled `assisted` in the results.

## 5. Capturing proof

Save everything inside the run folder:

```
qa-reports/<YYYY-MM-DD>-<skill>/
  findings.json      # the single source of truth (schema below)
  evidence/          # BUG-001-before.png, BUG-001-after.png, BUG-001-console.log ...
  report.md          # generated
  report.html        # generated
```

- **Name files after the finding:** `BUG-003-1-store-open.png`, `BUG-003-2-after-buy.png`. Numbered steps read as a story.
- **Video for every runtime bug when the tool can record.** One clip per bug (or per variant, e.g. tap vs keyboard), on the first reproduction; the other runs keep screenshots and state. For web games, `scripts/web-harness.mjs` records WebM **without ffmpeg** (DevTools screencast frames encoded by the browser's MediaRecorder) and can also save the clip as a strip of 6 stills (`framesDir`) for viewers that cannot play video. Desktop: the OS recorder or computer-use screenshots every step; Android: `adb shell screenrecord`.
- **Context + close-up:** for visual bugs, keep the full screenshot (where it happens) and add a cropped close-up (what is wrong). List the close-up first.
- **Before/after pairs** for anything about state (currency, inventory, unlocks).
- **Frame sequences** (3 to 6 screenshots) when the bug is motion or timing; video only if the tool supports it.
- **Logs:** save the relevant excerpt (with 5 to 10 lines of context), not the whole file. Strip personal data, tokens and paths that show a username.
- **State dumps:** for web games, read the live state with `page.evaluate` / `localStorage` and save it as JSON. Numbers in a dump beat numbers read off a screenshot.
- **Code/data references:** `path/to/file.ext:123` plus the quoted line.

## 6. Writing the finding

Each finding in `findings.json`:

```json
{
  "id": "BUG-001",
  "title": "Coins are deducted twice when the Buy button is double-clicked",
  "type": "bug",
  "severity": "critical",
  "area": "Store",
  "status": "confirmed",
  "repro_rate": "3/3",
  "environment": "Web build v1.4.0, Chrome 131, 1280x720",
  "preconditions": "New save with 500 coins",
  "steps": ["Open Store", "Select 'Gold Hat' (200 coins)", "Double-click Buy"],
  "expected": "One hat bought, 300 coins left",
  "actual": "One hat added, 100 coins left (200 charged twice)",
  "evidence": [
    { "type": "screenshot", "path": "evidence/BUG-001-1-before.png", "caption": "500 coins before" },
    { "type": "screenshot", "path": "evidence/BUG-001-2-after.png", "caption": "100 coins, one hat" },
    { "type": "state", "path": "evidence/BUG-001-state.json", "caption": "coins: 100, hats: 1" }
  ],
  "suspected_cause": "js/store.js:88 has no guard against a second click while the purchase is pending",
  "suggested_fix": "Disable the button until the purchase resolves"
}
```

- `type`: `bug` | `text` | `query` | `observation`
- `status`: `confirmed` | `unconfirmed`
- Title formula: **what is wrong + where + when**. No "Store broken".
- Steps start from a state anyone can reach (fresh install, or a save file you attach).

The full schema, including `run` and `coverage`, is in [references/findings-schema.md](references/findings-schema.md).

## 7. Building the report

```bash
node <this-skill>/scripts/build-report.mjs qa-reports/<run>/findings.json
# merge several runs into one report (used by test-game-full):
node <this-skill>/scripts/build-report.mjs qa-reports/a/findings.json qa-reports/b/findings.json --out qa-reports/<final-run>
# self-contained HTML (screenshots embedded) for sharing:
node <this-skill>/scripts/build-report.mjs qa-reports/<run>/findings.json --embed
```

The script validates every finding (missing steps, missing evidence, evidence files that do not exist, a "confirmed" bug seen once, a runtime bug with nothing visual) and stops with a list of problems. Fix them; do not delete the check. When merging, coverage rows may link findings filed by another module.

Before sharing or committing a report, drop the evidence nothing references:

```bash
node <this-skill>/scripts/prune-evidence.mjs qa-reports/<run>/findings.json            # list
node <this-skill>/scripts/prune-evidence.mjs qa-reports/<run>/findings.json --apply    # delete
```

Keep reports light: JPEG screenshots, PNG only for small crops, video at 1x scale (~600 kbps).

## 8. Handing over

End every run with a short chat summary:

1. One-line verdict and the counts by severity.
2. The top 3 findings with their IDs.
3. What was `BLOCKED` / `NOT_TESTED` and why.
4. Paths to `report.html` and `report.md`.
