# Automation plan: Pixel Swarm (store, boosters, rewards, XP)

Automate the 14 P1 cases as Playwright tests that read the save from localStorage. Gate the existing GitHub Pages deploy on them. Then move the store and reward rules into a small module, so 9 of these cases can become unit tests that run in milliseconds.

**Status: suggestion.** Nothing here is implemented. Pixel Swarm has its own repository, so every change below would be a change to that project, and it needs your approval first.

## 1. What to automate first

| Order | Case | Why first | Level | CI stage |
|---|---|---|---|---|
| 1 | TC-WIN-001: Continue pays the difficulty reward once | Every level pays through it | ui | push |
| 2 | TC-STORE-001: 1,000 coins for 30 gems moves exact amounts | Currency exchange | ui | push |
| 3 | TC-STORE-005: No Ads removes the banner and shows Owned | Paid entitlement | ui | push |
| 4 | TC-WIN-003: Tapping outside Level Complete keeps the reward | Lost rewards on a stray tap | ui | pr |
| 5 | TC-STORE-006: No Ads not sold again in the offer | Double charge | ui | pr |
| 6 | TC-XP-001: Wins raise XP and level | Locked content depends on it | ui | pr |
| 7 | TC-BOOST-002 and TC-BOOST-003: 7-slot limit on both paths | Level fairness | ui | pr |
| 8 | TC-WIN-005: No ads when No Ads is owned | Paid entitlement | ui | pr |
| 9 | TC-BUILD-001 and TC-BUILD-002: no debug in the release build | Free currency in a store release | ui | release |

Cases 4 to 7 depend on answers to questions Q-01, Q-03, Q-04 and Q-05. Write them as soon as the team answers.

**If the team calls one a bug,** the test is written now and marked as an expected failure with the bug ID. It turns green when the fix lands.

## 2. Test pyramid for this product

| Level | Cases now | After a small refactor | Where the effort goes |
|---|---|---|---|
| unit | 0 | 9 | Prices, rewards, slot limit, ad counter and unlock levels |
| api | 0 | 0 | No server: the game runs in the browser |
| ui | 29 | 20 | Journeys and pop-ups |
| manual | 2 | 2 | Double tap feel; empty name |

**Why the refactor.** The rules live inside one closure in `js/app.js`, so no test can import them.

- **What would move.** The product table, the win coins, the ad rule ("every 2 wins, not with No Ads, not with x2"), the slot limit and the booster unlock levels.
- **Where they would go.** A small `js/rules.js` that both the game and the tests use.
- **Why it matters.** TC-STORE-002, TC-STORE-003, TC-WIN-001, TC-WIN-004 to TC-WIN-006, TC-BOOST-002, TC-BOOST-003 and TC-BOOST-005 would then be unit tests.
- **The catch.** This is a code change to the game, so it is only a suggestion.

**How the UI tests reach states fast.** They use two things:

- **The save in localStorage.** Under the key `pixelswarm.save.v1`, tests read exact coins, gems, XP and boosters, and can write a prepared save.
- **The debug build's cheats.** Win, lose, coins, gems, levelup and boosters. Anything reached with a cheat is labelled "assisted" in the results.

**Locators.** The game has no `data-testid` attributes. Its buttons already carry `data-action`, for example `[data-action="buy"][data-item="noAds"]`, and these work as stable locators. Accessible names would be better still.

## 3. CI/CD stages

The repository already deploys to GitHub Pages on every push to main with `deploy-pages.yml`. Nothing tests the build before it ships.

| Stage | Trigger | What runs | Cases | Estimated time |
|---|---|---|---|---|
| push | every push to main, before deploy | Smoke: reward, coin exchange, No Ads. Chromium, debug build | 3 | under 2 min |
| pr | every pull request | Smoke plus all P1 cases except the release gate, plus P2 store and booster cases | 16 | 3 to 5 min |
| nightly | once a day | Everything automated, at phone and desktop sizes, Chromium and WebKit | 27 | 10 to 15 min |
| release | before `npm run package:itch` | The release-build gate (TC-BUILD-001, TC-BUILD-002) on `npm run build`, plus the manual list | 4 | 15 min |

The suggested change to `deploy-pages.yml` is to add a test job and make the deploy job need it, so a red smoke run stops the deploy. Not done: it changes the game repository.

## 4. Tool options

Facts checked against each tool's documentation on 2026-11-19.

| Need | Options | Recommended | Why | Cost / effort |
|---|---|---|---|---|
| UI runner | Playwright · Cypress | **Playwright + TypeScript** | Same as the evidence harness in this skills repo; WebKit for iPhone players; fakes the clock for TC-STORE-009 | Free. Half a day |
| Unit runner | Node's built-in test runner · Vitest | **Node's built-in runner** | Zero dependencies, fits a vanilla JS project | Free. Needs the refactor |
| Reporting | Built-in HTML + JUnit · Allure Report | **Built-in HTML + JUnit** | Enough for one developer; video and trace on failure | Free |
| Reporting (option) | Allure Report 3 | **Later, if the game gets a team** | Trends across nightly runs and grouping by feature help a producer read results | Free. Half a day, plus a place to keep history |
| CI | GitHub Actions | **GitHub Actions** | Already used for the deploy | Free for a public repo |
| Test management | The generated CSV · Qase · TestRail | **The CSV** | 31 cases fit a spreadsheet | Free |

## 5. What not to automate

| Area | Why it stays manual |
|---|---|
| Double tap on store items (TC-STORE-011) | First decide what two taps should mean (Q-02) |
| Empty or spaces-only name (TC-NAME-003) | Rule not written (Q-06) |
| Fun, feel and difficulty | Human judgement; playtest sessions |
| Real-money purchases | Only in the phone app with store test accounts |

## 6. Decisions for you

- [ ] Cases: approve all 31, or list the IDs to reject or change
- [ ] Answer or forward the 6 questions in [questions.md](questions.md)
- [ ] UI runner: Playwright + TypeScript (recommended) / other
- [ ] Reporting: built-in HTML + JUnit (recommended) / add Allure / other
- [ ] Refactor the rules into `js/rules.js` for unit tests: yes / later / no
- [ ] Gate the GitHub Pages deploy on the smoke tests: yes / not now
- [ ] Write the starter tests in the Pixel Swarm repository now: yes / no
