# Automation plan: SauceDemo (Swag Labs)

Start with the 11 P1 cases in Playwright with TypeScript. Report with Playwright's built-in HTML report plus JUnit XML, and run them in GitHub Actions. This costs about one day to set up and keeps every pull request under 5 minutes.

**Status: suggestion.** Nothing here is implemented until you approve the cases and choose the tools in section 6.

## 1. What to automate first

These are the 11 P1 cases. They cover money, login and the cart, and they run on every change.

| Order | Case | Why first | Level | CI stage |
|---|---|---|---|---|
| 1 | TC-CO-001: Buying two products shows the right totals and completes the order | The money journey end to end | ui | push |
| 2 | TC-LOGIN-001: Standard user logs in and sees the product list | Gates everything; every other test starts here | ui | push |
| 3 | TC-CAT-001: Product list shows all 6 products with the right prices | Catches price changes before checkout | ui | push |
| 4 | TC-CART-001: Adding one product shows 1 on the badge | First step of every purchase | ui | push |
| 5 | TC-LOGIN-004: Wrong password is refused | Security rule | ui | pr |
| 6 | TC-LOGIN-006: Locked-out user cannot log in | Security rule | ui | pr |
| 7 | TC-SESSION-001: Product page while logged out returns to login | Access control | ui | pr |
| 8 | TC-SESSION-004: Back after logout shows no private page | Privacy on shared computers | ui | pr |
| 9 | TC-SESSION-003: Logout returns to the login page | Session rule | ui | pr |
| 10 | TC-CART-002: Removing a product updates list and badge | What is bought | ui | pr |
| 11 | TC-CO-002: All 6 products show the right totals | Money at the boundary | ui | pr |

Then the P2 cases at `pr` level: the exact error messages and the tax rounding (TC-CO-003).

## 2. Test pyramid for this product

| Level | Cases | Where the effort goes |
|---|---|---|
| unit | 0 | Not possible: no access to the source code |
| api | 0 | Not possible: the site has no public API |
| ui | 48 | All automation sits here. Keep the tests short and independent |
| manual | 6 | Layout judgement, keyboard-only pass, and cases waiting for the team's answers |

This pyramid is upside down, and that is a fact of the product, not a choice. With the source code, these would move down a level:

- **Login messages:** TC-LOGIN-002 to TC-LOGIN-007.
- **Checkout field rules:** TC-CO-004 to TC-CO-007.
- **Tax rounding:** TC-CO-003.

They would become unit or API tests that run in milliseconds. One UI test per message would remain to prove it shows on screen.

## 3. CI/CD stages

| Stage | Trigger | What runs | Cases | Estimated time |
|---|---|---|---|---|
| push | every push to main | Smoke: login, catalog, add to cart, two-product purchase. Chromium only | 4 | under 1 min |
| pr | every pull request | Smoke plus every P1 and the P2 messages and tax. Chromium only | 20 | 2 to 4 min |
| nightly | 03:00 UTC every day | Everything automated, in Chromium, Firefox, WebKit and a phone size | 48 | 10 to 15 min |
| release | before a release | Nightly plus the manual list: TC-CO-010, TC-CO-011, TC-CROSS-003 | 51 | about 1 hour with the manual pass |

The pr stage runs 20 cases: the 4 push cases plus the 16 pr cases. Times are estimates for a site this size, to be measured after the first runs.

Rules:

- **A failing push or pr run blocks the merge.**
- **Fix flaky tests at the cause.** Repeat the test and read the trace. Never add fixed waits.
- **Mark known bugs as expected failures.** Use `test.fail()` with the bug or question ID. For example, if the team says Q-03 is a bug, TC-MENU-001 becomes an expected failure until it is fixed.
- **Keep the evidence.** Each run uploads the HTML report, JUnit file, screenshots, videos and traces of failures as a CI artifact for 14 days.

**Three cases wait for answers.** TC-LOGIN-008, TC-CAT-007 and TC-CART-006 are not automated until the team answers Q-06, Q-10 and Q-11. Automating a rule nobody wrote locks in today's behaviour by accident.

## 4. Tool options

Facts checked against each tool's documentation on 2026-11-19. Sources are listed in the skill's automation guide.

| Need | Options | Recommended | Why | Cost / effort |
|---|---|---|---|---|
| UI test runner | Playwright · Cypress · Selenium | **Playwright + TypeScript** | Needs WebKit (Safari) for TC-CROSS-001; it is built in. Waits on its own; trace viewer for failures | Free. Half a day to set up |
| API tests | Playwright request · Postman + Newman | **None for now** | No public API | None |
| Reporting | Built-in HTML + JUnit XML · Allure Report · GitHub annotations | **Built-in HTML + JUnit XML + GitHub annotations** | Zero extra tools; screenshots, video and trace per failure; failures shown on the pull request | Free, already in Playwright |
| Reporting (option) | Allure Report 3 | **Only if you want history and trends** | Shows trends across nightly runs and groups by feature, which helps if non-developers read the results. Adds `allure-playwright`, the `allure` npm package, and a place to keep history between runs | Free and open source. About half a day more |
| CI service | GitHub Actions · GitLab CI · Jenkins | **GitHub Actions** | The portfolio lives on GitHub; free standard runners for public repositories | Free for a public repo |
| Test management | CSV in a spreadsheet · TestRail · Xray · Qase | **The generated CSV for now** | 54 cases fit in a spreadsheet; import into TestRail, Xray or Qase later if a team adopts it | Free |
| Accessibility | @axe-core/playwright + manual keyboard pass | **Both** | TC-CROSS-004 runs inside the UI tests; TC-CROSS-003 needs a person | Free |
| Visual | Playwright toHaveScreenshot · Percy · Chromatic | **toHaveScreenshot, only for TC-USERS-004** | Built in; one comparison does not justify a paid service | Free. Screenshots must be stored per browser |

## 5. What not to automate

| Area | Why it stays manual |
|---|---|
| Layout with very long names (TC-CO-010) | Needs a person to judge whether the layout breaks |
| Keyboard-only purchase (TC-CROSS-003) | Focus visibility needs human eyes |
| Back after an order (TC-CO-011) | Explore by hand first; depends on Q-01 |
| Cases waiting for answers (TC-LOGIN-008, TC-CAT-007, TC-CART-006) | Rules not decided yet |
| Dynamic Catalog menu | Not explored yet: map it first |
| Exploratory sessions on the six user types | Finding the unknown is a human job; run 30 minutes per user type before a release |

## 6. Decisions for you

Nothing in this plan is built until you answer these:

- [ ] Cases: approve all 54, or list the IDs to reject or change
- [ ] UI runner: Playwright + TypeScript (recommended) / Cypress / other
- [ ] Reporting: built-in HTML + JUnit (recommended) / add Allure / other
- [ ] CI service: GitHub Actions (recommended) / other / not now
- [ ] Where the test code goes: a separate folder in this example (recommended) / another repository
- [ ] Write the starter tests for the approved P1 cases now: yes / no
- [ ] Answer or forward the 12 questions in [questions.md](questions.md)
