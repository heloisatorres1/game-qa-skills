# Automation plan: <product>

<one-sentence answer: what to automate first, with which tools, and what it costs>

**Status: suggestion.** Nothing is implemented until you approve the cases and choose the tools at the end of this page.

## 1. What to automate first

| Order | Case | Why first | Level | CI stage |
|---|---|---|---|---|
| 1 | TC-...: <title> | <risk + how often it runs> | ui | push |

## 2. Test pyramid for this product

| Level | Cases | Where the effort goes |
|---|---|---|
| unit | | <or: not possible, no access to the code> |
| api | | |
| ui | | |
| manual | | |

<one or two sentences: is the shape healthy? If most cases are UI, say which ones could move down a level.>

## 3. CI/CD stages

| Stage | Trigger | What runs | Cases | Estimated time |
|---|---|---|---|---|
| push | every push | smoke | | |
| pr | every pull request | P1 regression | | |
| nightly | once a day | P1 + P2, all browsers | | |
| release | before a release | everything + manual list | | |

Rules: a failing test blocks the merge; flaky tests are fixed at the cause; known bugs are marked as expected failures with the bug ID; reports, screenshots, video and traces are kept as CI artifacts.

## 4. Tool options

For each need: the options, my recommendation for this product, and why. Facts checked against each tool's documentation on <date>.

| Need | Options | Recommended | Why | Cost / effort |
|---|---|---|---|---|
| UI test runner | Playwright · Cypress · Selenium | | | |
| API tests | Playwright request · Postman + Newman · ... | | | |
| Reporting | Built-in HTML + JUnit · Allure Report · ... | | | |
| CI service | GitHub Actions · GitLab CI · Jenkins | | | |
| Test management | CSV in a spreadsheet · TestRail · Xray · Qase | | | |
| Accessibility | @axe-core/playwright + manual pass | | | |

## 5. What not to automate

| Area | Why it stays manual |
|---|---|
| | |

## 6. Decisions for you

Nothing in this plan is built until you answer these:

- [ ] Cases: approve all, or list the IDs to reject or change
- [ ] UI runner: <recommended> / other
- [ ] Reporting: <recommended> / Allure / other
- [ ] CI service: <recommended> / other / not now
- [ ] Where the test code goes: <project> / a separate folder
- [ ] Write the starter tests for the approved P1 cases now: yes / no
