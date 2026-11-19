# Coverage: SauceDemo (Swag Labs)

**Product:** SauceDemo (Swag Labs) (public demo site as of 2026-11-19) · **Date:** 2026-11-19 · **Scope:** The whole site: login, session, catalog, cart, checkout, menu and the six test users. Read from the live site only, no source code.

**Read from:** url: https://www.saucedemo.com/ · doc: Credentials listed on the login page (accepted usernames and password)

**Approval:** partial by Repository owner on 2026-11-19. The owner asked to prove the skill with the recommended options. Approved for the starter: the 11 P1 cases plus TC-USERS-001 and TC-USERS-002, to show how a failing test is reported. The other 41 cases stay suggested.

Each feature and how many cases it has of each type. Rejected cases are not counted. A dash means no case: the "Gaps" column says why.

| Feature | Risk | Happy | Negative | Edge | Total | P1 | Unit | API | UI | Manual | Gaps |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Login | high | 1 | 5 | 3 | 9 | 3 | — | — | 8 | 1 |  |
| Session and access control | high | 1 | 2 | 2 | 5 | 3 | — | — | 5 | — |  |
| Product catalog and sorting | medium | 5 | 1 | 2 | 8 | 1 | — | — | 7 | 1 |  |
| Cart | high | 3 | 1 | 4 | 8 | 2 | — | — | 7 | 1 |  |
| Checkout | high | 2 | 4 | 6 | 12 | 2 | — | — | 10 | 2 |  |
| Side menu | low | 3 | — | — | 3 | — | — | — | 3 | — | No negative input on the menu. Dynamic Catalog (Lazy Load, Spinner, Slider) was found but not explored: see Not covered. |
| User types | medium | 4 | — | — | 4 | — | — | — | 4 | — | Each user type is one partition of valid input, so all cases here are happy-path checks run with a different user. Negative cases per user are covered by F-LOGIN. |
| Browsers, devices and accessibility | medium | 1 | — | 4 | 5 | — | — | — | 4 | 1 | Checklist items, no input of their own. |

**Automation:** 48 of 54 cases (89%) are suggested for automation. 6 stay manual.

| CI stage | Cases |
|---|---|
| push | 4 |
| pr | 16 |
| nightly | 28 |
| release | 3 |
| none | 3 |

| Technique | Cases |
|---|---|
| equivalence-partitioning | 17 |
| boundary-value | 8 |
| decision-table | 0 |
| state-transition | 11 |
| use-case | 6 |
| error-guessing | 4 |
| checklist | 8 |

| Status (all cases) | Cases |
|---|---|
| suggested | 41 |
| approved | 13 |
| rejected | 0 |
| changed | 0 |

## Not covered

| Area | Reason |
|---|---|
| Dynamic Catalog menu (Lazy Load, Spinner, Slider) | Found in the menu during this run; not explored. Next step: map it and add cases for loading states. |
| Unit tests | No access to the source code |
| API tests | The site has no public API; everything runs in the browser |
| Real payment and order storage | The demo has no payment step and no visible order history |
| Security beyond smoke checks | Not authorised for a security test of a third-party site |
