# test-design on SauceDemo

`test-design` read the public practice shop [SauceDemo](https://www.saucedemo.com/) from the live site only, with no source code. It produced **54 test cases** and **12 questions** for the team, plus an automation plan. After approval, it wrote **13 Playwright tests** and proved them.

Run on 2026-11-19.

## Phase A: suggest

| Output | What it holds |
|---|---|
| [test-cases.md](test-cases.md) | 54 cases in 8 features, each with steps, an exact expected result, a source, a priority and an automation level |
| [test-cases.csv](test-cases.csv) | The same cases, ready to import into TestRail, Xray, Qase or a spreadsheet |
| [coverage.md](coverage.md) | Every feature by happy, negative and edge, and what is not covered |
| [questions.md](questions.md) | 12 open questions: behaviour no rule explains |
| [automation-plan.md](automation-plan.md) | What to automate first, the CI/CD stages, tool options with Allure as an option, and the decisions to make |
| [inventory/](inventory/), [inventory-logged-in/](inventory-logged-in/) | Page scans (forms, fields, limits, test IDs, console errors) with full-page screenshots, and the observed behaviour behind every expected result |

| Type | Cases | | Priority | Cases | | Level | Cases |
|---|---|---|---|---|---|---|---|
| happy | 20 | | P1 | 11 | | ui | 48 |
| negative | 13 | | P2 | 25 | | manual | 6 |
| edge | 21 | | P3 | 18 | | unit, api | 0 (no code, no public API) |

**Questions the run raised.** These are not bugs. The team decides.

- **An empty cart can be bought** for $0.00, and its item total shows "$0" instead of "$0.00".
- **Names made of spaces** pass checkout.
- **A product URL with an unknown ID** shows "ITEM NOT FOUND" with the price "$√-1" and a working Add to cart button. The cart badge then shows 1 while the cart list is empty. This was reproduced 2 out of 2 times.
- **Reset App State** empties the cart, but the buttons keep saying "Remove" until a reload.
- **The sort resets to A to Z** after viewing a product.
- **The cart survives a logout.**
- **Tax looks like 8%**, but no rule says so.

The checker also proved it refuses bad cases. Five cases were damaged on purpose, and it rejected all 8 problems and wrote nothing: [proof/checker-refuses-bad-cases.txt](proof/checker-refuses-bad-cases.txt).

## Phase B: implement, after approval

**What was approved.** The owner asked for the starter to be built with the recommended options:

- **Runner:** Playwright with TypeScript.
- **Reporting:** the built-in HTML report plus JUnit XML. Allure was not chosen.
- **CI:** GitHub Actions. The file is written but not enabled.

13 cases were approved for the starter: the 11 P1 cases, plus 2 user-type cases to show how a real failure is reported. The other 41 cases stay "suggested". The approval is recorded in `run.approval` in [test-cases.json](test-cases.json).

| Proof | Result |
|---|---|
| First run | 9 passed, 4 failed. Two failures were **test mistakes**: the Logout locator. They were fixed with the site's test ID. [run-1](proof/run-1.txt) |
| Runs 2, 3 and 4 after the fix | All **11 P1 tests passed 3 out of 3** times. [run-2](proof/run-2.txt) · [run-3](proof/run-3.txt) · [run-4](proof/run-4.txt) |
| Fail on purpose | TC-CO-001 with the total changed to $43.19 failed with "Expected $43.19, Received $43.18", then passed again once restored. [fail-on-purpose](proof/fail-on-purpose.txt) |
| CI stage tags | The push stage selects 4 tests and the pull request stage selects 11. All passed. [ci-stages](proof/ci-stages.txt) |
| Product failures | **TC-USERS-001 and TC-USERS-002 failed 4 out of 4 times, for product reasons.** They were reported, not "fixed" by changing the test |

**The two product failures:**

- **problem_user.** The last name typed into Last Name lands in First Name. Checkout stops with "Error: Last Name is required". [Screenshot](proof/TC-USERS-001-problem_user-last-name-lost.png) · [video](proof/TC-USERS-001-problem_user.webm)
- **error_user.** The totals are right, but Finish does nothing, and the order never completes. [Screenshot](proof/TC-USERS-002-error_user-finish-does-nothing.png) · [video](proof/TC-USERS-002-error_user.webm)

SauceDemo builds these users to misbehave on purpose. The point is that the suggested equivalence classes found them, and the tests report them as failures.

**Starter code:** [starter/](starter/). Run it like this:

```bash
cd starter
npm ci
npx playwright install        # or set PW_CHANNEL=msedge to use the installed Edge
npx playwright test --project=chromium
```

[starter/ci/tests.yml](starter/ci/tests.yml) is the GitHub Actions workflow for the three stages. It is not enabled: GitHub only runs workflows from the repository root.

## Not verified

- **Firefox and WebKit.** Only Chromium, through the installed Edge, was run locally. Those browsers were not downloaded.
- **The CI workflow.** It has not run on GitHub.
- **Run times.** The CI stage times in the automation plan are estimates.
- **Checkout with an unknown item.** Whether it can be completed was not confirmed.
