# Automation guide

How to decide what to automate, at which level, when it runs in CI/CD, and which tools to suggest. Everything here is a **suggestion** for the user. The user approves and chooses before anything is built.

## What to automate

Automate a case when most of these are true:

- It runs often (every change, every release).
- It is high risk (P1): money, login, data.
- The expected result is exact and stable (a value, a message, a page).
- The screen or API does not change every week.
- It is boring or error-prone by hand (many data combinations, many browsers).

Keep it manual when:

- It needs human judgement: usability, look and feel, "is this clear?", fun in a game.
- It is exploratory: finding the unknown.
- The feature changes every week, or the case will run once.
- Automating costs more than it will ever save.

## The level: the test pyramid

Test each rule at the **lowest level that can prove it**. Lower is faster and more stable.

| Level | Proves | Speed | Typical share |
|---|---|---|---|
| `unit` | One function or rule in code (a price, a validator) | milliseconds | most tests |
| `api` | Business rules and data through the API, no screen | under a second | many |
| `ui` | A user journey across screens, in a real browser | seconds | few, the important journeys |
| `manual` | Judgement and exploration | minutes | the list a person runs |

Example: "a 51-character name is refused" is best as a unit or API test. Only one UI test needs to check that the error message shows on the screen.

If the user has no access to the code, unit tests are not possible. Say so, and put those rules at API or UI level.

## CI/CD stages

CI (continuous integration) runs the tests automatically on every change. CD (continuous delivery) ships the change when the tests pass.

| Stage | Trigger | What runs | Time target |
|---|---|---|---|
| `push` | every push | smoke: the main journey and login, one browser | under 5 min |
| `pr` | every pull request | all automated P1 cases, one browser | under 15 min |
| `nightly` | once a day | full regression: P1 and P2, all browsers, phone size | under 60 min |
| `release` | before a release | everything, plus the manual list run by a person | as needed |

Rules that keep a pipeline trusted:

- **A failing test blocks the merge** at `push` and `pr`. Otherwise people learn to ignore red.
- **Flaky tests** (pass sometimes, fail sometimes) are found by repeating the test, fixed at the cause, and never "fixed" by adding waits. Track them; quarantine only with a ticket.
- **Known bugs**: mark the test as an expected failure linked to the bug report (`test.fail()` in Playwright). The suite stays green, the bug stays visible, and the test says when the bug is fixed.
- **Keep the evidence**: the report, screenshots, video and trace of failures are saved as CI artifacts.
- **Retries**: 1 or 2 in CI only, and the report must show which tests needed a retry.

## Tool options

For each need, suggest 2 or 3 options, recommend one for **this** product and say why. Prefer what the project already uses. Re-check any fact here against the tool's own documentation before you put it in a plan.

### Test runner for the UI

| Option | Strong points | Watch out |
|---|---|---|
| **Playwright** (TypeScript, also Python, Java, .NET) | Chromium, Firefox and WebKit; waits on its own; runner, report and trace included; free | Newer than Selenium; teams may know Cypress |
| **Cypress** (JavaScript/TypeScript) | Visual runner with time travel; popular; free core | Chrome, Edge and Firefox; WebKit is only experimental |
| **Selenium WebDriver** (many languages) | The standard for years; works with almost any language and grid | More code for waits and setup; no runner or report built in |

### API tests

| Option | Strong points | Watch out |
|---|---|---|
| **Playwright `request`** | Same project and report as the UI tests | Fewer API-only extras |
| **Postman + Newman** | Easy to start, readable by non-coders, runs in CI with Newman | Collections get hard to review in code review |
| **REST Assured** (Java) / **pytest + requests** (Python) | Fits Java or Python teams | Separate stack from the UI tests |

### Reporting

| Option | Strong points | Watch out |
|---|---|---|
| **Built-in HTML report** (Playwright `html`) | Zero setup; screenshots, video and trace per failure | One run at a time; no history between runs |
| **Allure Report** | Rich report: steps, attachments, history and trends between runs, grouping by feature and severity, works with many runners and languages | One more tool to set up and host. Allure 3 installs with Node (`npm install allure`); Allure 2's command line needs Java. History needs the previous results kept between CI runs |
| **JUnit XML** (Playwright `junit`) | Read by most CI services and test management tools; shows failures in the CI page | Plain: no screenshots |
| **GitHub annotations** (Playwright `github`) | Failures shown on the pull request lines | GitHub Actions only |

A common, simple choice: built-in HTML report as a CI artifact, plus JUnit XML for the CI page. Suggest Allure when the team wants history, trends or a report to share with non-developers, and accepts one more tool.

### CI service

| Option | Strong points | Watch out |
|---|---|---|
| **GitHub Actions** | Built into GitHub; free standard runners for public repositories | GitHub only |
| **GitLab CI** | Built into GitLab; shows JUnit results in merge requests | GitLab only |
| **Jenkins** | Self-hosted, any setup, many plugins | Someone must run and maintain the server |
| **Azure Pipelines** | Fits Azure and Microsoft teams | More setup outside that ecosystem |

### Test management (where the cases live)

| Option | Strong points | Watch out |
|---|---|---|
| **Spreadsheet** (the generated CSV) | Free, today | No run history or links to CI |
| **TestRail** | Widely used; runs, plans, reports | Paid |
| **Xray** or **Zephyr** (in Jira) | Cases next to the Jira tickets | Paid; tied to Jira |
| **Qase** | Modern, has a free tier | Smaller community |

Most of these import CSV. `test-cases.csv` has standard columns; map them on import.

### Extras, only if the product needs them

| Need | Options |
|---|---|
| Accessibility | `@axe-core/playwright` (automated scan inside the UI tests), plus a manual keyboard and screen reader pass |
| Visual changes | Playwright `toHaveScreenshot` (built in), or a hosted service such as Percy or Chromatic (paid) |
| Page speed | Lighthouse CI |
| Load | k6, JMeter |

## Writing the tool decisions

End `automation-plan.md` with a checklist the user answers, for example:

```
- [ ] Approve the cases (all, or list the IDs to reject or change)
- [ ] Runner: Playwright (recommended) / Cypress / other
- [ ] Reporting: built-in HTML + JUnit (recommended) / Allure / other
- [ ] CI: GitHub Actions (recommended) / other / not now
- [ ] Where the code goes: this project / a separate folder
- [ ] Write the starter tests now: yes / no
```

## Sources

- Playwright reporters: https://playwright.dev/docs/test-reporters
- Playwright best practices: https://playwright.dev/docs/best-practices
- Allure Report 3 install: https://allurereport.org/docs/v3/install/
- Cypress browsers: https://docs.cypress.io/app/references/launching-browsers
- axe-core for Playwright: https://playwright.dev/docs/accessibility-testing
