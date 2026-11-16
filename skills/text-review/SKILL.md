---
name: text-review
description: Engine-agnostic review of the text players see in a game - typos, spelling, grammar, punctuation, capitalisation consistency, terminology, placeholders, plurals and leftover dev text - in UI, dialogue, tutorials, store, notifications and store-page copy. Reads strings, not code logic. Every finding cites file:line and, when the game can run, a screenshot of the text in context. Use when the user asks to proofread, spell-check, review copy, check strings, localisation text or "text that players see".
argument-hint: "[project path or build URL] [language]"
---

# Text Review

Find every text problem a player could notice, and prove each one.

**In scope:** anything rendered to the player: UI labels, buttons, menus, dialogue, tutorials, tooltips, toasts, achievements, item and level names, store copy, notifications, error messages shown on screen, credits, the HTML title and app name, store-page / README copy if the user asks.
**Out of scope:** code comments, identifiers, log messages, debug/cheat menus (unless the user says the debug build is public), test data. Say what you excluded in the report.

Before starting, load the shared standard: read `../qa-evidence/SKILL.md` (statuses, evidence, findings.json, report builder).

## Workflow

### 1. Recon (5 minutes)

- Engine, string sources, target languages and the **reference language** (usually the one the team writes in).
- Is there a style guide, glossary or term list? Check `docs/`, the GDD, a `glossary` file, or ask. If none, you will build a term list in step 3.
- Is there a runnable build? If yes, you will screenshot findings in context (step 5).
- Spelling variant: US vs UK English (color/colour). Detect from the existing text; flag the minority as inconsistencies, not typos.

### 2. Extract every string

```bash
node <this-skill>/scripts/extract-strings.mjs <project-root> --out qa-reports/<date>-text-review/strings
```

It scans HTML, JSON, CSV/TSV string tables, `.po`, Android/iOS/`.resx`/XLIFF files, Godot scenes, Unity YAML (`m_Text`), YAML, and string literals in code (JS/TS, C#, GDScript, Lua, Python, C++...). Output:

- `strings.txt`: one line per string: `ID  file:line  kind [key]  text  ⚑ flags`
- `strings.json`: same data plus `global_checks` (capitalisation variants, mixed ellipsis/apostrophe styles, placeholder mismatches between languages)

The script is deliberately generous: it prefers false positives to missing text. You decide what is player-facing.

**Gaps the script cannot cover**: text baked into images/textures, binary assets (`.uasset`, compiled resources), server-delivered text, and text built at runtime from fragments. For these, use the running game (step 5) and list anything you could not reach as `NOT_TESTED`.

Use `--exclude <substring>` to drop folders such as third-party plugins. Use `--no-code` for projects where all text lives in string tables.

### 3. Review

Go through `strings.txt` file by file. Read each player-facing string as a player would. Use [references/text-checklist.md](references/text-checklist.md) for the full list of checks. The core ones:

1. **Spelling** (including names of game items: check that each one is spelled the same everywhere).
2. **Grammar**: agreement, articles, tense, missing/extra words.
3. **Punctuation**: missing final punctuation where the surrounding strings have it, doubled marks, spaces before punctuation (English), unbalanced quotes/brackets.
4. **Capitalisation consistency**: pick the style the majority uses for each element type (buttons, titles, headers) and flag the outliers. Start from `global_checks`.
5. **Terminology**: the same thing must always have the same name ("coins" vs "gold", "level" vs "stage"). Build a term table as you go.
6. **Placeholders and variables**: `{…}` marks a runtime value. Check plurals ("1 coins"), word order, and that every translation keeps the same placeholders.
7. **Leftover dev text**: TODO, lorem ipsum, "test", internal names, `undefined`/`NaN`.
8. **Tone and clarity**: only flag when the meaning is unclear or contradicts the game. Rewrites for style alone are `type: query`.

Work in batches of about 150 strings and write findings into `findings.json` as you go, so nothing is lost if the session is long.

Do **not** flag: intentional stylisation (character voice, onomatopoeia like "Whoosh!", brand names), proper nouns, or text that only appears in debug tools (unless in scope).

### 4. Verify each candidate

Before a string becomes a finding:

- Open the source at `file:line` and confirm the text and its context (is it really shown to players? which screen?).
- Check if the same string appears elsewhere (all occurrences go in the same finding).
- For "the majority style is X" claims, count: "12 of 14 buttons use Title Case".

### 5. Capture in-game proof (when a build runs)

For **every** finding whose text appears in the game, show it in context: navigate to the screen and take a screenshot plus a close-up crop of the string (`evidence/TXT-004-store.jpg`, `evidence/TXT-004-crop.png`). For layout problems (overlap, truncation) that depend on timing or animation, add a short video. This also catches problems static review cannot: truncation, overflow, wrong font glyphs, text overlapping art, untranslated strings. Log those as extra findings with screenshots.

If you cannot reach a screen, the `file_ref` evidence is still valid; note "not seen in-game".

### 6. Write findings

One finding per problem (group identical strings). Text findings use:

```json
{
  "id": "TXT-003",
  "title": "Inconsistent capitalisation: 'Special offer' on the shop banner vs 'Special Offer' on the popup",
  "type": "text",
  "severity": "minor",
  "area": "Store",
  "status": "confirmed",
  "repro_rate": "static",
  "expected": "Special Offer (Title Case, matches the other popup titles)",
  "actual": "Special offer",
  "evidence": [
    { "type": "file_ref", "ref": "index.html:224", "caption": "<h2>Special Offer</h2>" },
    { "type": "file_ref", "ref": "index.html:640", "caption": "Special offer" },
    { "type": "screenshot", "path": "evidence/TXT-003-banner.png", "caption": "Banner on the home screen" }
  ],
  "suggested_fix": "Special Offer"
}
```

Severity guide for text: `major` = wrong information or meaning (wrong price in text, wrong instructions), or text on the first screen/store page; `minor` = visible typo or grammar error, inconsistent terms; `trivial` = punctuation/capitalisation polish in rarely seen places.

Always include `suggested_fix` with the corrected text: a text bug with a ready fix is the fastest to close.

### 7. Coverage and report

Coverage areas: one per string source or screen group (e.g. `index.html`, `Tutorial`, `Store`, `Dialogue`), plus `Text in images` and `Server text` when relevant. Then:

```bash
node ../qa-evidence/scripts/build-report.mjs qa-reports/<date>-text-review/findings.json
```

Also write `qa-reports/<date>-text-review/terms.md`: the term table and the capitalisation rule per element type. Teams can adopt it as a style guide.

## Done when

- [ ] Every string source found in recon is listed in coverage.
- [ ] Every finding has a `file:line` reference and a suggested fix.
- [ ] Out-of-scope text (debug, comments) is stated in `run.scope`.
- [ ] The report builds without errors.
