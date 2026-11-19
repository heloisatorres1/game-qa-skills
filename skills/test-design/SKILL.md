---
name: test-design
description: Reads a website, web app, API, source code, game or document (spec, user story, PDF) and suggests test cases - happy path, negative path and edge cases - built with named techniques (equivalence partitioning, boundary values, decision tables, state transitions), each traced to its source and prioritised by risk. It also suggests what to automate and at which level (unit, API, UI or manual), a CI/CD plan and the tools to use (runner, reporting such as Allure, CI service, test management). It only suggests - the user approves the cases and picks the tools before anything is implemented. Mainly web, works for any software. Use when the user asks for test cases, a test plan, test scenarios, test design, coverage ideas, what to automate, or a CI/CD test strategy.
argument-hint: "[URL, project path or document] [feature or scope]"
---

# Test Design

Read the product, then suggest the tests a careful QA lead would write. **The user decides.** This skill suggests test cases, an automation plan and tools. It implements nothing until the user has approved the cases and chosen the tools.

**In scope:** web sites and web apps (main focus), APIs, desktop and mobile software, games, and documents that describe them.
**Out of scope:** running a test pass and filing bugs. That is the job of the other skills in this pack (`test-game-full` for games). If you notice something that looks broken while reading, write it as a question (step 7), not a bug.

Load the shared standard for the access modes and the golden rules: read `../qa-evidence/SKILL.md` sections 1 and 4. Rules 1 (observe, don't assume), 5 (never fabricate) and 7 (design questions are not bugs) apply here word for word.

## The two phases

| Phase | What happens | Needs approval? |
|---|---|---|
| **A. Suggest** | Read the product, write the cases, the automation plan and the tool options. Stop and present them. | No. Always run it. |
| **B. Implement** | Write starter tests and a CI file for the **approved** cases with the **chosen** tools, then prove they work. | **Yes.** Only after the user says which cases and which tools. |

Never start phase B on your own, even if it looks obvious. On an unattended run, stop after phase A.

Every run writes to `qa-reports/<YYYY-MM-DD>-test-design/`:

```
test-cases.json     # source of truth (schema: references/output-format.md)
test-cases.md       # generated: readable cases, grouped by feature
test-cases.csv      # generated: import into TestRail, Xray, Zephyr, Qase or a spreadsheet
coverage.md         # generated: features x happy/negative/edge, gaps, what is not covered
questions.md        # generated: open questions for the team
automation-plan.md  # written by you: what to automate first, CI/CD stages, tool options, decisions
inventory/          # what the scanners found (forms, rules), with sources
starter/            # phase B only: the approved starter tests and CI file
proof/              # the checker refusing bad cases; phase B test runs, the fail-on-purpose run, failure screenshots
```

## Phase A: Suggest

### 1. Recon

Write down, in `test-cases.json` under `run`:

- **What the inputs are.** A URL, a code folder, a document, or several. Use every input you were given.
- **What the product does and who uses it**, in two sentences.
- **What hurts most if it breaks.** Money, login and accounts, personal data, data loss, legal text, the main journey. This drives priority.
- **The scope.** The whole product or one feature. Agree it with the user if the product is large.
- **Existing tests.** Look for `tests/`, `e2e/`, `cypress/`, `*.spec.*`, `*.test.*`, CI files in `.github/workflows/`, `.gitlab-ci.yml` or `Jenkinsfile`. Suggest what is missing; do not repeat what exists.

### 2. Build the feature map

List every feature, screen, form and API endpoint. For each one, collect the **rules**: limits, required fields, formats, states, permissions, messages. Every rule has a **source**.

| Input | How to find features and rules | Source to cite |
|---|---|---|
| Live site | Open every page. Run `scripts/page-inventory.js` in the browser on each page (forms, fields, limits, buttons, links). Try each form once with valid data. | URL + screenshot in `inventory/` |
| Source code | `node <this-skill>/scripts/scan-rules.mjs <project-root> --out <run>/inventory`. Then read routes, validators, state enums and error messages. | `file:line` |
| API | OpenAPI/Swagger file, route definitions, or the network tab of the live site. | spec path or endpoint |
| Document | Read it all. Each "must", "should", limit, example and error message is a rule. | document name + section or page |
| Game | Use `../test-game-full/references/feature-catalog.md` for the feature list. | `file:line` or screenshot |

`page-inventory.js` is plain browser JavaScript. Run it with any browser tool (Playwright `page.evaluate`, the Playwright browser tools, Claude in Chrome). For public pages there is a command-line wrapper: `node <this-skill>/scripts/scan-page.mjs <url> [<url>...] --out <run>/inventory`. It needs `playwright-core` in the run folder, as in the rest of this pack.

Pages behind a login: log in with a test account the user gave you, never a real one. If there is none, the feature is `not_covered` with that reason.

### 3. Write the cases

For each feature, write cases in three groups. Follow [references/test-techniques.md](references/test-techniques.md).

- **Happy path.** Everything correct, the way a normal user does it. At least one per feature, always.
- **Negative path.** Wrong or forbidden input or action. The system must refuse it with a clear message and keep the data safe.
- **Edge cases.** Boundaries (min-1, min, max, max+1), empty, one, many, very long text, special characters, double click, back button, refresh, two tabs, session timeout, slow network.

Pick the technique that fits the rule and name it on the case: equivalence partitioning, boundary values, decision table, state transition, use case, error guessing or checklist. Then apply the cross-cutting checklist for the product type: [references/web-checklist.md](references/web-checklist.md) for web, the feature catalog for games.

Case rules:

- **One case, one behaviour.** "Wrong password" and "locked user" are two cases.
- **Concrete expected result.** The exact message, value, page or state. Never "works", "works correctly", "as expected" or "no errors".
- **Every case has a source**: the rule it checks. A case that comes from your experience and not from a rule uses technique `error-guessing` or `checklist` and says why in `source`.
- **Assumptions are labelled.** When the product does not say what should happen, write the case with `assumption` set, and add a question (step 7).
- **Test data is real and specific.** "a 51-character name", not "a long name".
- **Size it to the product.** A login form needs 8 to 15 cases, not 60. Merge cases that would always pass or fail together.

### 4. Prioritise by risk

Give each case P1, P2 or P3 with a one-line `priority_reason`. Risk = impact if it breaks x how likely it is to break.

| Priority | Use when |
|---|---|
| P1 | Money, login, data loss, security, legal, or the main journey. Run on every change. |
| P2 | Important features and the most likely negative cases. Run daily. |
| P3 | Rare paths, cosmetic edges, polish. Run before a release. |

### 5. Suggest the automation level

For each case, choose one level and give the reason. Follow [references/automation-guide.md](references/automation-guide.md).

| Level | Use for |
|---|---|
| `unit` | A rule inside one function (a price calculation, a validator). Fastest. |
| `api` | Business rules and data without the screen. Fast and stable. |
| `ui` | Journeys a user makes across screens. Fewer of these: they are slower. |
| `manual` | Exploratory testing, usability, look and feel, screens that change every week, one-off checks. |

Also set `ci_stage`: `push` (fast smoke), `pr` (P1 regression), `nightly` (full regression, all browsers), `release` (everything plus the manual list) or `none`.

### 6. Write the automation plan

Write `automation-plan.md` from [templates/automation-plan.md](templates/automation-plan.md). It must contain:

1. **What to automate first**: the 5 to 10 cases with the best value, and why.
2. **The test pyramid** for this product: counts per level, and where the effort should go.
3. **CI/CD stages**: what runs on push, on pull request, nightly and before a release, and roughly how long each takes.
4. **Tool options** for each need: test runner, API testing, reporting (built-in HTML report, Allure, JUnit XML for CI dashboards), CI service, test management, accessibility, visual, performance. For each need give 2 or 3 options, a recommendation for **this** product, the reason and the cost or effort. Prefer what the project already uses. Facts about tools come from the reference or from the tool's own documentation, never from memory.
5. **What not to automate**, and why.
6. **Decisions for the user**: a checklist of every choice they must make before phase B.

### 7. Questions for the team

Anything unclear, contradictory or surprising goes into `questions` with its source and why it matters. Examples: no rule for the maximum length, two documents disagree, the site allows something that looks wrong (checkout with an empty cart). A question is not a bug. The team decides.

### 8. Build and check

```bash
node <this-skill>/scripts/build-cases.mjs qa-reports/<run>/test-cases.json
```

The script refuses cases with no source, no steps, a vague expected result, a missing priority reason, a duplicate ID, or a manual case with no reason. It also refuses a feature with no happy path. It writes `test-cases.md`, `test-cases.csv`, `coverage.md` and `questions.md`. Fix the problems; do not delete the check. Warnings (a feature with no negative or edge case) need either new cases or a `gaps` note on the feature.

### 9. Present and stop

Give the user a short summary in chat:

1. What you read, and the counts: features, cases by type, by priority, by automation level.
2. The top 5 cases to automate first.
3. The open questions.
4. The tool decisions they must make, each with your recommendation.
5. The paths to `test-cases.md`, `test-cases.csv` and `automation-plan.md`.

Then **ask**: which cases do you approve, reject or want changed? Which tools do you choose? Should I write the starter tests? Stop here and wait.

## Phase B: Implement (only after approval)

1. **Record the decision.** Set each case's `status` to `approved`, `rejected` or `changed`, and fill `run.approval` (who, date, what was chosen). Rebuild. Unreviewed cases stay `suggested`.
2. **Ask where the code goes.** The user's project, or the run's `starter/` folder. Never install packages or add files to the user's project without saying which ones first.
3. **Write tests only for approved cases** with level `ui` or `api`, with the chosen tools. Start small: the approved P1 cases. Each test name and comment carries the case ID (`TC-LOGIN-003`) so results trace back to the case. Follow the tool's own best practices; for Playwright see [templates/playwright/](templates/playwright/).
4. **Prove every test**, and save the output in `proof/`:
   - it passes 3 runs in a row;
   - it **fails on purpose** once: change the expected value, run, see the failure, undo it. A test that cannot fail tests nothing;
   - a failure caused by the test itself (a wrong locator, a missing wait on the right condition) is fixed in the test, and the first run is kept as proof of what changed;
   - a failure that looks like a real product bug is reported to the user, with the case ID. It is not "fixed" by changing the test.
5. **Write the CI file** for the chosen CI service, from [templates/github-actions.yml](templates/github-actions.yml) or its equivalent. Do not commit, push or enable it. That is the user's call.
6. **Hand over**: what was written, what passed, what failed and why, and what is left to decide.

## Limits

This skill designs tests from what it can read and see. It cannot know rules that exist only in someone's head, so its questions list matters as much as its cases. It does not replace exploratory testing: the plan always lists what a human should explore.
