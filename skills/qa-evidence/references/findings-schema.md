# findings.json schema

One file per run. `build-report.mjs` reads it, checks it and writes `report.md` and `report.html` next to it (or into `--out`).

```json
{
  "run": {
    "skill": "test-store",
    "game": "Pixel Quest",
    "build": "v1.4.0 (commit a1b2c3d)",
    "platform": "Web, Chrome 131, Windows 11",
    "access_mode": "Playwright script + localStorage reads",
    "date": "2026-11-16",
    "tester": "Claude (AI-assisted QA)",
    "scope": "Store: purchase flow, currency, inventory, edge cases",
    "verdict": "fail",
    "summary": "Purchases work, but double-clicking Buy charges twice (BUG-001)."
  },
  "coverage": [
    { "area": "Purchase flow", "status": "FAIL", "checks_total": 8, "checks_passed": 7, "findings": ["BUG-001"], "notes": "" },
    { "area": "Real-money IAP", "status": "NOT_TESTED", "notes": "Sandbox account not available" }
  ],
  "findings": [ { "...": "see SKILL.md section 6" } ]
}
```

## `run`

| Field | Required | Notes |
|---|---|---|
| `skill` | yes | Skill that produced the run (`test-game-full` for merged reports) |
| `game` | yes | |
| `build` | yes | Version, commit or build date. `unknown` is allowed but say so in `summary` |
| `platform` | yes | OS, browser/device, resolution |
| `access_mode` | yes | How you reached the game (see game-access.md) |
| `date` | yes | ISO date |
| `tester` | no | Defaults to `Claude (AI-assisted QA)` |
| `scope` | yes | What was in scope |
| `verdict` | no | `pass` / `pass_with_issues` / `fail` / `blocked`. Computed from findings when missing |
| `summary` | yes | 1 to 3 sentences, plain language |

## `coverage[]`

| Field | Required | Notes |
|---|---|---|
| `area` | yes | Feature or check group |
| `status` | yes | `PASS` `FAIL` `PARTIAL` `BLOCKED` `NOT_TESTED` |
| `checks_total`, `checks_passed` | no | Integers |
| `findings` | when `FAIL` | Finding IDs |
| `notes` | when `PARTIAL`/`BLOCKED`/`NOT_TESTED` | The reason |
| `evidence` | when `PASS` | Array of evidence objects or paths proving it works |

## `findings[]`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `BUG-###`, `TXT-###`, `QRY-###`, `OBS-###`. Unique within the file |
| `title` | yes | What + where + when |
| `type` | yes | `bug` `text` `query` `observation` |
| `severity` | yes for `bug`/`text` | `blocker` `critical` `major` `minor` `trivial` |
| `area` | yes | Matches a coverage `area` when possible |
| `status` | yes | `confirmed` / `unconfirmed` |
| `repro_rate` | yes for runtime bugs | `"2/2"`, `"1/5"`. Use `"static"` for file-based findings |
| `environment` | no | Overrides `run.platform` when different |
| `preconditions` | no | |
| `steps` | yes for `bug` | Array of strings |
| `expected`, `actual` | yes for `bug`/`text` | |
| `evidence` | yes (at least 1) | `{ "type", "path" or "ref", "caption" }`. Types: `screenshot` `video` `frames` (a folder of stills, shown as a strip) `log` `state` `file_ref` `save`. Runtime bugs need at least one `screenshot`, `video` or `frames` |
| `no_visual_reason` | no | Why a runtime bug has nothing visual (e.g. "audio-only defect"). Lifts the visual-evidence rule |
| `suspected_cause` | no | Hypothesis, worded as one |
| `suggested_fix` | no | |
| `related` | no | Other finding IDs (duplicates across modules) |
| `source_run` | no | Filled by the merge step |

For `file_ref` evidence, use `"ref": "data/levels.json:42"` and put the quoted line in `caption`.
