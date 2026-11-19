# Test cases: SauceDemo (Swag Labs)

**Product:** SauceDemo (Swag Labs) (public demo site as of 2026-11-19) · **Date:** 2026-11-19 · **Scope:** The whole site: login, session, catalog, cart, checkout, menu and the six test users. Read from the live site only, no source code.

**Read from:** url: https://www.saucedemo.com/ · doc: Credentials listed on the login page (accepted usernames and password)

**Approval:** partial by Repository owner on 2026-11-19. The owner asked to prove the skill with the recommended options. Approved for the starter: the 11 P1 cases plus TC-USERS-001 and TC-USERS-002, to show how a failing test is reported. The other 41 cases stay suggested.

A practice online shop by Sauce Labs. Users log in with one of six test accounts, browse 6 products, add them to a cart and check out. There is no real payment.

## Summary

54 cases in 8 features. 12 open question(s). See [coverage.md](coverage.md) and [questions.md](questions.md).

| Type | Cases | | Priority | Cases | | Automation | Cases |
|---|---|---|---|---|---|---|---|
| happy | 20 | | P1 | 11 | | unit | 0 |
| negative | 13 | | P2 | 25 | | api | 0 |
| edge | 21 | | P3 | 18 | | ui | 48 |
|  |  | |  |  | | manual | 6 |

**What hurts most if it breaks:** Checkout totals and tax are money; Login and session gate every page; The cart decides what is bought; Some test users are built to misbehave, so every user type needs the main journey.

**Existing tests:** None visible: site only, no repository. Scans in inventory/ and inventory-logged-in/; observed behaviour in inventory/observations.json and inventory/observations-2.txt.

## Login (F-LOGIN)

Risk: **high**. Every other page needs it. Source: https://www.saucedemo.com/ (inventory/inventory.md).

Rules found:

- **R-LOGIN-1** Username is required: 'Epic sadface: Username is required' *(observations.json: empty)*
- **R-LOGIN-2** Password is required: 'Epic sadface: Password is required' *(observations.json: noPassword)*
- **R-LOGIN-3** Accepted usernames: standard_user, locked_out_user, problem_user, performance_glitch_user, error_user, visual_user; password secret_sauce for all *(login page credentials box (observations.json: loginText))*
- **R-LOGIN-4** Wrong or unknown credentials: 'Epic sadface: Username and password do not match any user in this service' *(observations.json: wrong, unknown)*
- **R-LOGIN-5** locked_out_user is refused: 'Epic sadface: Sorry, this user has been locked out.' *(observations.json: locked)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-LOGIN-001](#tc-login-001) | Standard user logs in and sees the product list | happy | P1 | ui · push | approved |
| [TC-LOGIN-002](#tc-login-002) | Login with both fields empty asks for the username | negative | P2 | ui · pr | suggested |
| [TC-LOGIN-003](#tc-login-003) | Login without a password asks for the password | negative | P2 | ui · pr | suggested |
| [TC-LOGIN-004](#tc-login-004) | Login with a wrong password is refused with a clear message | negative | P1 | ui · pr | approved |
| [TC-LOGIN-005](#tc-login-005) | Unknown username gets the same message as a wrong password | negative | P2 | ui · pr | suggested |
| [TC-LOGIN-006](#tc-login-006) | Locked-out user cannot log in and is told why | negative | P1 | ui · pr | approved |
| [TC-LOGIN-007](#tc-login-007) | Username with different capital letters is refused | edge | P3 | ui · nightly | suggested |
| [TC-LOGIN-008](#tc-login-008) | Username with spaces before and after: trimmed or refused | edge | P3 | manual · none | suggested |
| [TC-LOGIN-009](#tc-login-009) | Pressing Enter in the password field logs in | edge | P3 | ui · nightly | suggested |

### TC-LOGIN-001

**Standard user logs in and sees the product list**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P1 (Login gates the whole shop)
- **Automation:** ui, CI stage push. Main journey, runs on every change
- **Source:** R-LOGIN-3
- **Status:** approved

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: standard_user / secret_sauce

Steps:

1. Type the username
2. Type the password
3. Click Login

Expected:

- URL is https://www.saucedemo.com/inventory.html
- The title 'Products' is shown
- 6 products are listed

### TC-LOGIN-002

**Login with both fields empty asks for the username**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Common mistake; message must guide the user)
- **Automation:** ui, CI stage pr. Exact message, stable, cheap to run
- **Source:** R-LOGIN-1
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Steps:

1. Leave both fields empty
2. Click Login

Expected:

- Message 'Epic sadface: Username is required' is shown
- URL stays https://www.saucedemo.com/

### TC-LOGIN-003

**Login without a password asks for the password**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Common mistake; message must guide the user)
- **Automation:** ui, CI stage pr. Exact message, stable
- **Source:** R-LOGIN-2
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: standard_user / (empty)

Steps:

1. Type the username
2. Leave the password empty
3. Click Login

Expected:

- Message 'Epic sadface: Password is required' is shown
- URL stays https://www.saucedemo.com/

### TC-LOGIN-004

**Login with a wrong password is refused with a clear message**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P1 (Security: a wrong password must never get in)
- **Automation:** ui, CI stage pr. Security rule, must never regress
- **Source:** R-LOGIN-4
- **Status:** approved

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: standard_user / wrong_pass

Steps:

1. Type the username
2. Type the wrong password
3. Click Login

Expected:

- Message 'Epic sadface: Username and password do not match any user in this service' is shown
- URL stays https://www.saucedemo.com/

### TC-LOGIN-005

**Unknown username gets the same message as a wrong password**

- **Type:** negative · **Technique:** checklist · **Priority:** P2 (Security: the message must not reveal which accounts exist)
- **Automation:** ui, CI stage pr. Cheap, protects a security rule
- **Source:** R-LOGIN-4; web-checklist.md security basics
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: nobody / secret_sauce

Steps:

1. Type an unknown username
2. Type the password
3. Click Login

Expected:

- Message 'Epic sadface: Username and password do not match any user in this service' is shown, identical to TC-LOGIN-004

### TC-LOGIN-006

**Locked-out user cannot log in and is told why**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P1 (A locked account getting in is a security failure)
- **Automation:** ui, CI stage pr. Security rule, must never regress
- **Source:** R-LOGIN-5
- **Status:** approved

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: locked_out_user / secret_sauce

Steps:

1. Type the username
2. Type the password
3. Click Login

Expected:

- Message 'Epic sadface: Sorry, this user has been locked out.' is shown
- URL stays https://www.saucedemo.com/

### TC-LOGIN-007

**Username with different capital letters is refused**

- **Type:** edge · **Technique:** equivalence-partitioning · **Priority:** P3 (Rare input; current behaviour is safe)
- **Automation:** ui, CI stage nightly. Cheap; documents that usernames are case-sensitive
- **Source:** observations.json: caseUser
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: Standard_User / secret_sauce

Steps:

1. Type the username with capitals
2. Type the password
3. Click Login

Expected:

- Message 'Epic sadface: Username and password do not match any user in this service' is shown

### TC-LOGIN-008

**Username with spaces before and after: trimmed or refused**

- **Type:** edge · **Technique:** error-guessing · **Priority:** P3 (Pasted usernames often carry spaces; low impact)
- **Automation:** manual, CI stage none. Wait for the team's answer before automating a rule nobody wrote
- **Source:** observations.json: spaces; error-guessing: pasted credentials
- **Assumption:** Refusing is acceptable until the team says otherwise (Q-06)
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: ' standard_user ' / secret_sauce

Steps:

1. Type the username with a space before and after
2. Type the password
3. Click Login

Expected:

- Today: message 'Epic sadface: Username and password do not match any user in this service'
- Update the expected result once Q-06 is answered

### TC-LOGIN-009

**Pressing Enter in the password field logs in**

- **Type:** edge · **Technique:** checklist · **Priority:** P3 (Convenience path, low risk)
- **Automation:** ui, CI stage nightly. Cheap keyboard check
- **Source:** web-checklist.md forms: submit with Enter; observations-2.txt: enter login
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: standard_user / secret_sauce

Steps:

1. Type the username
2. Type the password
3. Press Enter

Expected:

- URL is https://www.saucedemo.com/inventory.html

## Session and access control (F-SESSION)

Risk: **high**. Private pages must not open without a login. Source: observations.json: deepLinkLoggedOut, backAfterLogout; observations-2.txt: step2 logged out.

Rules found:

- **R-SESSION-1** A logged-out visit to a private page returns to / with 'Epic sadface: You can only access '<path>' when you are logged in.' *(observations.json: deepLinkLoggedOut; observations-2.txt: step2 logged out)*
- **R-SESSION-2** Logout from the menu returns to the login page *(observations.json: logoutUrl)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-SESSION-001](#tc-session-001) | Opening the product page while logged out returns to login with a message | negative | P1 | ui · pr | approved |
| [TC-SESSION-002](#tc-session-002) | Opening checkout step two while logged out returns to login | negative | P2 | ui · nightly | suggested |
| [TC-SESSION-003](#tc-session-003) | Logout from the menu returns to the login page | happy | P1 | ui · pr | approved |
| [TC-SESSION-004](#tc-session-004) | Browser Back after logout does not show private pages | edge | P1 | ui · pr | approved |
| [TC-SESSION-005](#tc-session-005) | A reload keeps the user logged in | edge | P2 | ui · nightly | suggested |

### TC-SESSION-001

**Opening the product page while logged out returns to login with a message**

- **Type:** negative · **Technique:** state-transition · **Priority:** P1 (Access control on private pages)
- **Automation:** ui, CI stage pr. Security rule, one fast step
- **Source:** R-SESSION-1
- **Status:** approved

Preconditions:

- Logged out (no session cookie)

Steps:

1. Open https://www.saucedemo.com/inventory.html directly

Expected:

- URL is https://www.saucedemo.com/
- Message 'Epic sadface: You can only access '/inventory.html' when you are logged in.' is shown

### TC-SESSION-002

**Opening checkout step two while logged out returns to login**

- **Type:** negative · **Technique:** state-transition · **Priority:** P2 (Deep link into the money flow)
- **Automation:** ui, CI stage nightly. Same check as TC-SESSION-001 on another page; cheap
- **Source:** R-SESSION-1
- **Status:** suggested

Preconditions:

- Logged out (no session cookie)

Steps:

1. Open https://www.saucedemo.com/checkout-step-two.html directly

Expected:

- Message 'Epic sadface: You can only access '/checkout-step-two.html' when you are logged in.' is shown

### TC-SESSION-003

**Logout from the menu returns to the login page**

- **Type:** happy · **Technique:** state-transition · **Priority:** P1 (Shared computers: users must be able to leave)
- **Automation:** ui, CI stage pr. Core session rule
- **Source:** R-SESSION-2
- **Status:** approved

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Open the menu
2. Click Logout

Expected:

- URL is https://www.saucedemo.com/
- The Login button is shown

### TC-SESSION-004

**Browser Back after logout does not show private pages**

- **Type:** edge · **Technique:** checklist · **Priority:** P1 (Privacy on shared computers)
- **Automation:** ui, CI stage pr. Easy to break when caching changes
- **Source:** web-checklist.md accounts; observations.json: backAfterLogout
- **Status:** approved

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Open the menu
2. Click Logout
3. Press the browser Back button

Expected:

- URL is https://www.saucedemo.com/
- Message 'Epic sadface: You can only access '/inventory.html' when you are logged in.' is shown
- No product is visible

### TC-SESSION-005

**A reload keeps the user logged in**

- **Type:** edge · **Technique:** state-transition · **Priority:** P2 (Losing the session on reload would lose the cart flow)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** web-checklist.md navigation: refresh
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Reload the page

Expected:

- URL stays https://www.saucedemo.com/inventory.html
- 6 products are listed

## Product catalog and sorting (F-CATALOG)

Risk: **medium**. Wrong prices or order mislead the buyer, but checkout shows the totals again. Source: https://www.saucedemo.com/inventory.html (inventory-logged-in/inventory.md).

Rules found:

- **R-CAT-1** 6 products with prices: Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99 *(observations.json: products, prices)*
- **R-CAT-2** Sort options: Name (A to Z), Name (Z to A), Price (low to high), Price (high to low). Default A to Z *(inventory-logged-in/inventory.md sort select)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-CAT-001](#tc-cat-001) | Product list shows all 6 products with the right prices | happy | P1 | ui · push | approved |
| [TC-CAT-002](#tc-cat-002) | Sort by price low to high puts the Onesie first | happy | P2 | ui · pr | suggested |
| [TC-CAT-003](#tc-cat-003) | Sort by price high to low puts the Fleece Jacket first | happy | P2 | ui · nightly | suggested |
| [TC-CAT-004](#tc-cat-004) | Sort by name Z to A puts the Test.allTheThings() T-Shirt first | happy | P3 | ui · nightly | suggested |
| [TC-CAT-005](#tc-cat-005) | Products with the same price keep a fixed order when sorted by price | edge | P3 | ui · nightly | suggested |
| [TC-CAT-006](#tc-cat-006) | Product detail page shows the same name and price as the list | happy | P2 | ui · nightly | suggested |
| [TC-CAT-007](#tc-cat-007) | Chosen sort order is kept after viewing a product | edge | P3 | manual · none | suggested |
| [TC-CAT-008](#tc-cat-008) | A product ID that does not exist shows a clear not-found page with nothing to buy | negative | P2 | ui · nightly | suggested |

### TC-CAT-001

**Product list shows all 6 products with the right prices**

- **Type:** happy · **Technique:** use-case · **Priority:** P1 (Prices shown are what the buyer agrees to)
- **Automation:** ui, CI stage push. Catches price and catalog changes on every push
- **Source:** R-CAT-1
- **Status:** approved

Preconditions:

- Logged in as standard_user

Steps:

1. Look at the product list

Expected:

- Names and prices, in order: Sauce Labs Backpack $29.99; Sauce Labs Bike Light $9.99; Sauce Labs Bolt T-Shirt $15.99; Sauce Labs Fleece Jacket $49.99; Sauce Labs Onesie $7.99; Test.allTheThings() T-Shirt (Red) $15.99

### TC-CAT-002

**Sort by price low to high puts the Onesie first**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P2 (Main sort option)
- **Automation:** ui, CI stage pr. Stable, exact
- **Source:** R-CAT-2
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Choose 'Price (low to high)' in the sort list

Expected:

- First product is 'Sauce Labs Onesie' at $7.99
- Prices never go down from one product to the next

### TC-CAT-003

**Sort by price high to low puts the Fleece Jacket first**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P2 (Sort option)
- **Automation:** ui, CI stage nightly. Stable, exact
- **Source:** R-CAT-2
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Choose 'Price (high to low)' in the sort list

Expected:

- First product is 'Sauce Labs Fleece Jacket' at $49.99
- Prices never go up from one product to the next

### TC-CAT-004

**Sort by name Z to A puts the Test.allTheThings() T-Shirt first**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P3 (Least used sort option)
- **Automation:** ui, CI stage nightly. Stable, exact
- **Source:** R-CAT-2
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Choose 'Name (Z to A)' in the sort list

Expected:

- First product is 'Test.allTheThings() T-Shirt (Red)'
- Last product is 'Sauce Labs Backpack'

### TC-CAT-005

**Products with the same price keep a fixed order when sorted by price**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P3 (Cosmetic, but a classic sorting edge)
- **Automation:** ui, CI stage nightly. Cheap once the rule is confirmed
- **Source:** observations-2.txt: lohi order
- **Assumption:** Ties are broken by name A to Z, as seen today (Q-10)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Test data: Bolt T-Shirt and Test.allTheThings() T-Shirt (Red), both $15.99

Steps:

1. Choose 'Price (low to high)'
2. Note the order of the two $15.99 products
3. Reload and sort again

Expected:

- Both times: 'Sauce Labs Bolt T-Shirt' then 'Test.allTheThings() T-Shirt (Red)'

### TC-CAT-006

**Product detail page shows the same name and price as the list**

- **Type:** happy · **Technique:** use-case · **Priority:** P2 (Price mismatch between pages misleads buyers)
- **Automation:** ui, CI stage nightly. Stable
- **Source:** R-CAT-1; inventory-logged-in/www-saucedemo-com-inventory-item-html.json
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Click 'Sauce Labs Backpack'
2. Read the name and price
3. Click 'Back to products'

Expected:

- Detail page shows 'Sauce Labs Backpack' and $29.99
- Back to products returns to https://www.saucedemo.com/inventory.html

### TC-CAT-007

**Chosen sort order is kept after viewing a product**

- **Type:** edge · **Technique:** state-transition · **Priority:** P3 (Usability, no data risk)
- **Automation:** manual, CI stage none. Today the sort resets to A to Z; wait for the team's answer (Q-10)
- **Source:** observations-2.txt: sort after back az
- **Assumption:** Keeping the user's choice is the expected behaviour; today it resets (Q-10)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, on the product list

Steps:

1. Choose 'Price (low to high)'
2. Open any product
3. Click 'Back to products'

Expected:

- The sort list still shows 'Price (low to high)' and the Onesie is first

### TC-CAT-008

**A product ID that does not exist shows a clear not-found page with nothing to buy**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Shared or old links reach this page; it must not sell a non-existent item)
- **Automation:** ui, CI stage nightly. Three URLs, one data-driven test
- **Source:** observations-3.txt: all three IDs show 'ITEM NOT FOUND', price '$√-1' and an Add to cart button; inventory/unknown-item-1-product-page.jpg
- **Assumption:** A missing product should not be buyable (Q-12)
- **Status:** suggested

Preconditions:

- Logged in as standard_user

Test data: id=99, id=-1, id=abc

Steps:

1. Open https://www.saucedemo.com/inventory-item.html?id=99
2. Repeat with id=-1 and id=abc

Expected:

- A not-found message is shown
- No price and no Add to cart button are shown

## Cart (F-CART)

Risk: **high**. The cart decides what is bought and charged. Source: https://www.saucedemo.com/cart.html; observations-2.txt.

Rules found:

- **R-CART-1** Add to cart turns the button into Remove and updates the badge count *(observations.json: badgeAll)*
- **R-CART-2** The badge disappears when the cart is empty *(observations-2.txt: badge after removing last 0)*
- **R-CART-3** The cart survives a reload and a logout/login *(observations-2.txt: badge after reload 1, badge after logout+login 1)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-CART-001](#tc-cart-001) | Adding one product shows 1 on the cart badge and a Remove button | happy | P1 | ui · push | approved |
| [TC-CART-002](#tc-cart-002) | Removing a product from the cart page updates the list and the badge | happy | P1 | ui · pr | approved |
| [TC-CART-003](#tc-cart-003) | Removing the last product hides the badge | edge | P2 | ui · pr | suggested |
| [TC-CART-004](#tc-cart-004) | Adding all 6 products shows 6 on the badge | edge | P2 | ui · nightly | suggested |
| [TC-CART-005](#tc-cart-005) | Cart contents survive a page reload | edge | P2 | ui · nightly | suggested |
| [TC-CART-006](#tc-cart-006) | Cart after logout and login again | edge | P3 | manual · none | suggested |
| [TC-CART-007](#tc-cart-007) | Continue Shopping returns to the product list with the cart kept | happy | P3 | ui · nightly | suggested |
| [TC-CART-008](#tc-cart-008) | Cart badge and cart list always agree | negative | P2 | ui · nightly | suggested |

### TC-CART-001

**Adding one product shows 1 on the cart badge and a Remove button**

- **Type:** happy · **Technique:** boundary-value · **Priority:** P1 (The cart decides what is bought)
- **Automation:** ui, CI stage push. Main journey step
- **Source:** R-CART-1
- **Status:** approved

Preconditions:

- Logged in as standard_user, cart empty

Steps:

1. Click 'Add to cart' on Sauce Labs Backpack

Expected:

- Cart badge shows 1
- The Backpack button now says 'Remove'

### TC-CART-002

**Removing a product from the cart page updates the list and the badge**

- **Type:** happy · **Technique:** state-transition · **Priority:** P1 (Buyers must be able to change their mind)
- **Automation:** ui, CI stage pr. Core cart rule
- **Source:** R-CART-1
- **Status:** approved

Preconditions:

- Logged in as standard_user, Backpack and Bike Light in the cart

Steps:

1. Open the cart
2. Click 'Remove' on Sauce Labs Bike Light

Expected:

- Only 'Sauce Labs Backpack' is listed
- Cart badge shows 1

### TC-CART-003

**Removing the last product hides the badge**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Boundary from 1 to 0 items)
- **Automation:** ui, CI stage pr. Cheap boundary check
- **Source:** R-CART-2
- **Status:** suggested

Preconditions:

- Logged in as standard_user, only the Backpack in the cart

Steps:

1. Open the cart
2. Click 'Remove' on Sauce Labs Backpack

Expected:

- The cart list is empty
- No badge is shown on the cart icon (not '0')

### TC-CART-004

**Adding all 6 products shows 6 on the badge**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Maximum cart size)
- **Automation:** ui, CI stage nightly. Upper boundary of the cart
- **Source:** R-CART-1; observations.json: badgeAll
- **Status:** suggested

Preconditions:

- Logged in as standard_user, cart empty

Steps:

1. Click 'Add to cart' on all 6 products

Expected:

- Cart badge shows 6
- No 'Add to cart' button is left on the page
- The cart page lists 6 products

### TC-CART-005

**Cart contents survive a page reload**

- **Type:** edge · **Technique:** state-transition · **Priority:** P2 (Losing the cart on reload loses sales)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-CART-3
- **Status:** suggested

Preconditions:

- Logged in as standard_user, Backpack in the cart

Steps:

1. Reload the page

Expected:

- Cart badge still shows 1
- The Backpack button still says 'Remove'

### TC-CART-006

**Cart after logout and login again**

- **Type:** edge · **Technique:** state-transition · **Priority:** P3 (Product decision, then a cheap check)
- **Automation:** manual, CI stage none. Wait for the team's answer before locking the rule in a test
- **Source:** R-CART-3
- **Assumption:** Keeping the cart is intended (Q-11)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, Backpack in the cart

Steps:

1. Log out
2. Log in again as standard_user

Expected:

- Today: cart badge shows 1 (cart kept). Confirm this is wanted (Q-11)

### TC-CART-007

**Continue Shopping returns to the product list with the cart kept**

- **Type:** happy · **Technique:** use-case · **Priority:** P3 (Navigation helper)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** observations-2.txt: continue shopping url
- **Status:** suggested

Preconditions:

- Logged in as standard_user, Backpack in the cart, on the cart page

Steps:

1. Click 'Continue Shopping'

Expected:

- URL is https://www.saucedemo.com/inventory.html
- Cart badge shows 1

### TC-CART-008

**Cart badge and cart list always agree**

- **Type:** negative · **Technique:** error-guessing · **Priority:** P2 (A badge that disagrees with the cart confuses what is being bought)
- **Automation:** ui, CI stage nightly. Cheap invariant check; can be reused after every cart action
- **Source:** observations-4.txt: localStorage cart [99], badge 1, cart list empty (2/2 runs); inventory/unknown-item-2-cart-empty-list.jpg
- **Assumption:** The unknown item should not enter the cart at all (Q-12)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, cart empty

Steps:

1. Open https://www.saucedemo.com/inventory-item.html?id=99
2. Click Add to cart
3. Open the cart

Expected:

- The number on the badge equals the number of items listed in the cart (here: no badge and an empty list, or the item refused)

## Checkout (F-CHECKOUT)

Risk: **high**. Money: totals, tax and the order itself. Source: https://www.saucedemo.com/checkout-step-one.html; https://www.saucedemo.com/checkout-step-two.html; https://www.saucedemo.com/checkout-complete.html.

Rules found:

- **R-CO-1** First Name, Last Name and Postal Code are required, checked in that order: 'Error: First Name is required', 'Error: Last Name is required', 'Error: Postal Code is required' *(observations.json: co_empty, co_noLast, co_noZip)*
- **R-CO-2** Tax looks like 8% of the item total, rounded to the cent: $39.98 -> $3.20; $129.94 -> $10.40; $7.99 -> $0.64 *(observations.json: twoItems, allItemsTotals; observations-2.txt: onesie (inferred, not documented))*
- **R-CO-3** Finish shows 'Thank you for your order!' and empties the cart *(observations-2.txt: badge after finish 0)*
- **R-CO-4** Cancel on step one returns to the cart; Cancel on step two returns to the product list with the cart kept *(observations-2.txt: cancel step1 url, cancel step2 url)*
- **R-CO-5** No length or format limits on the three fields in HTML *(inventory-logged-in/inventory.md: 'none in HTML'; observations.json: longNameLen 1000)*

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-CO-001](#tc-co-001) | Buying two products shows the right totals and completes the order | happy | P1 | ui · push | approved |
| [TC-CO-002](#tc-co-002) | Buying all 6 products shows the right totals | edge | P1 | ui · pr | approved |
| [TC-CO-003](#tc-co-003) | Tax on the cheapest product rounds to the cent | edge | P2 | ui · pr | suggested |
| [TC-CO-004](#tc-co-004) | Continue with all fields empty asks for the first name | negative | P2 | ui · pr | suggested |
| [TC-CO-005](#tc-co-005) | Continue without a last name asks for the last name | negative | P2 | ui · pr | suggested |
| [TC-CO-006](#tc-co-006) | Continue without a postal code asks for the postal code | negative | P2 | ui · pr | suggested |
| [TC-CO-007](#tc-co-007) | Fields with only spaces are refused as empty | edge | P2 | ui · nightly | suggested |
| [TC-CO-008](#tc-co-008) | Checkout with an empty cart is blocked | edge | P2 | ui · nightly | suggested |
| [TC-CO-009](#tc-co-009) | Cancel on step one returns to the cart; Cancel on step two returns to the products, cart kept | happy | P3 | ui · nightly | suggested |
| [TC-CO-010](#tc-co-010) | Very long names: limit or safe layout | edge | P3 | manual · release | suggested |
| [TC-CO-011](#tc-co-011) | Back after an order does not allow a second, empty order | edge | P3 | manual · release | suggested |
| [TC-CO-012](#tc-co-012) | Order confirmation page cannot be opened without an order | negative | P3 | ui · nightly | suggested |

### TC-CO-001

**Buying two products shows the right totals and completes the order**

- **Type:** happy · **Technique:** use-case · **Priority:** P1 (The money journey)
- **Automation:** ui, CI stage push. Highest-value journey, smoke on every push
- **Source:** R-CO-2; R-CO-3
- **Status:** approved

Preconditions:

- Logged in as standard_user, cart empty

Test data: Backpack ($29.99) + Bike Light ($9.99); Ana / Silva / 86000

Steps:

1. Add Backpack and Bike Light to the cart
2. Open the cart and click Checkout
3. Fill First Name, Last Name and Postal Code
4. Click Continue
5. Read the totals
6. Click Finish

Expected:

- Step two shows 'Item total: $39.98', 'Tax: $3.20' and 'Total: $43.18'
- After Finish: 'Thank you for your order!' is shown
- The cart badge is gone

### TC-CO-002

**Buying all 6 products shows the right totals**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P1 (Money at the maximum cart size)
- **Automation:** ui, CI stage pr. Money rule at the boundary
- **Source:** R-CO-2; observations.json: allItemsTotals
- **Status:** approved

Preconditions:

- Logged in as standard_user, cart empty

Test data: All 6 products; Ana / Silva / 86000

Steps:

1. Add all 6 products
2. Go through checkout step one
3. Read the totals on step two

Expected:

- 'Item total: $129.94', 'Tax: $10.40', 'Total: $140.34'

### TC-CO-003

**Tax on the cheapest product rounds to the cent**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Rounding errors are a classic money bug)
- **Automation:** ui, CI stage pr. Rounding rule; would be a unit test with access to the code
- **Source:** R-CO-2; observations-2.txt: onesie
- **Assumption:** Tax is 8% rounded half up to the cent (Q-04)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, cart empty

Test data: Sauce Labs Onesie ($7.99): 8% = $0.6392

Steps:

1. Add only the Onesie
2. Go through checkout step one
3. Read the totals on step two

Expected:

- 'Tax: $0.64' and 'Total: $8.63'

### TC-CO-004

**Continue with all fields empty asks for the first name**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Required data for the order)
- **Automation:** ui, CI stage pr. Exact message, stable
- **Source:** R-CO-1
- **Status:** suggested

Preconditions:

- Logged in, Backpack in the cart, on checkout step one

Steps:

1. Leave all fields empty
2. Click Continue

Expected:

- Message 'Error: First Name is required' is shown
- URL stays https://www.saucedemo.com/checkout-step-one.html

### TC-CO-005

**Continue without a last name asks for the last name**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Required data for the order)
- **Automation:** ui, CI stage pr. Exact message, stable
- **Source:** R-CO-1
- **Status:** suggested

Preconditions:

- Logged in, Backpack in the cart, on checkout step one

Test data: First Name: Ana

Steps:

1. Fill only First Name
2. Click Continue

Expected:

- Message 'Error: Last Name is required' is shown

### TC-CO-006

**Continue without a postal code asks for the postal code**

- **Type:** negative · **Technique:** equivalence-partitioning · **Priority:** P2 (Required data for the order)
- **Automation:** ui, CI stage pr. Exact message, stable
- **Source:** R-CO-1
- **Status:** suggested

Preconditions:

- Logged in, Backpack in the cart, on checkout step one

Test data: Ana / Silva / (empty)

Steps:

1. Fill First Name and Last Name
2. Click Continue

Expected:

- Message 'Error: Postal Code is required' is shown

### TC-CO-007

**Fields with only spaces are refused as empty**

- **Type:** edge · **Technique:** error-guessing · **Priority:** P2 (Orders with blank names cannot be delivered)
- **Automation:** ui, CI stage nightly. Cheap, once the team confirms the rule
- **Source:** web-checklist.md forms: spaces only; observations.json: co_spacesOnly (today it is accepted)
- **Assumption:** Spaces-only should count as empty. Today the site accepts them and goes to step two (Q-02)
- **Status:** suggested

Preconditions:

- Logged in, Backpack in the cart, on checkout step one

Test data: Three spaces in each field

Steps:

1. Type three spaces in First Name, Last Name and Postal Code
2. Click Continue

Expected:

- Message 'Error: First Name is required' is shown
- URL stays https://www.saucedemo.com/checkout-step-one.html

### TC-CO-008

**Checkout with an empty cart is blocked**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P2 (Empty orders pollute order data)
- **Automation:** ui, CI stage nightly. Cheap, once the team confirms the rule
- **Source:** observations.json: emptyCartCheckoutUrl, co_emptyCart_step2, emptyCartFinish (today a $0.00 order completes)
- **Assumption:** An empty cart should not reach the order (Q-01)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, cart empty

Steps:

1. Open the cart
2. Click Checkout

Expected:

- Checkout does not start, or a message says the cart is empty

### TC-CO-009

**Cancel on step one returns to the cart; Cancel on step two returns to the products, cart kept**

- **Type:** happy · **Technique:** state-transition · **Priority:** P3 (Way out of the flow, no data risk)
- **Automation:** ui, CI stage nightly. Stable
- **Source:** R-CO-4
- **Status:** suggested

Preconditions:

- Logged in, Onesie in the cart

Steps:

1. On step one click Cancel
2. Go to step two (fill the form, Continue)
3. On step two click Cancel

Expected:

- First Cancel: URL is https://www.saucedemo.com/cart.html
- Second Cancel: URL is https://www.saucedemo.com/inventory.html and the badge still shows 1

### TC-CO-010

**Very long names: limit or safe layout**

- **Type:** edge · **Technique:** boundary-value · **Priority:** P3 (No documented limit; layout risk only)
- **Automation:** manual, CI stage release. Needs a person to judge the layout, and the limit is unknown (Q-05)
- **Source:** R-CO-5
- **Assumption:** No limit exists today; the field accepted 1,000 characters (Q-05)
- **Status:** suggested

Preconditions:

- Logged in, Backpack in the cart, on checkout step one

Test data: First Name of 1,000 'A' characters

Steps:

1. Paste the long first name
2. Fill the other fields
3. Continue and Finish

Expected:

- Either the field stops at a documented maximum, or the order completes with the layout intact (no text over buttons)

### TC-CO-011

**Back after an order does not allow a second, empty order**

- **Type:** edge · **Technique:** error-guessing · **Priority:** P3 (Duplicate or empty orders)
- **Automation:** manual, CI stage release. Depends on Q-01; explore by hand first
- **Source:** observations-2.txt: back after finish shows step two with Total: $0.00
- **Assumption:** Same rule as TC-CO-008 (Q-01)
- **Status:** suggested

Preconditions:

- An order was just completed (on the 'Thank you' page)

Steps:

1. Press the browser Back button
2. Look at the totals
3. Click Finish again

Expected:

- The user is not offered a second order, or the empty order is refused

### TC-CO-012

**Order confirmation page cannot be opened without an order**

- **Type:** negative · **Technique:** state-transition · **Priority:** P3 (Confusing, but no money moves)
- **Automation:** ui, CI stage nightly. One step, once the rule is confirmed
- **Source:** inventory-logged-in/inventory.md: checkout-complete shows 'Thank you for your order!' on a direct visit
- **Assumption:** Direct access should not show a confirmation (Q-07)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, no order placed

Steps:

1. Open https://www.saucedemo.com/checkout-complete.html directly

Expected:

- The user is sent to the cart or product list, not shown 'Thank you for your order!'

## Side menu (F-MENU)

Risk: **low**. Navigation helpers; Reset App State touches the cart. Source: observations.json: menu, afterReset; observations-2.txt: about href.

Rules found:

- **R-MENU-1** Menu items: All Items, Dynamic Catalog, About, Logout, Reset App State *(observations.json: menu)*
- **R-MENU-2** About links to https://saucelabs.com/ *(observations-2.txt: about href)*

Gaps: No negative input on the menu. Dynamic Catalog (Lazy Load, Spinner, Slider) was found but not explored: see Not covered.

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-MENU-001](#tc-menu-001) | Reset App State empties the cart and resets every button | happy | P2 | ui · nightly | suggested |
| [TC-MENU-002](#tc-menu-002) | All Items returns to the product list from the cart | happy | P3 | ui · nightly | suggested |
| [TC-MENU-003](#tc-menu-003) | About opens the Sauce Labs site | happy | P3 | ui · nightly | suggested |

### TC-MENU-001

**Reset App State empties the cart and resets every button**

- **Type:** happy · **Technique:** state-transition · **Priority:** P2 (Leaves the screen out of step with the cart)
- **Automation:** ui, CI stage nightly. Stable once the expected behaviour is confirmed
- **Source:** observations.json: afterReset; observations-2.txt: before reload remove buttons 1, after reload 0
- **Assumption:** Buttons should reset at once. Today they keep saying 'Remove' until a reload (Q-03)
- **Status:** suggested

Preconditions:

- Logged in as standard_user, Backpack in the cart, on the product list

Steps:

1. Open the menu
2. Click 'Reset App State'

Expected:

- The cart badge is gone
- The Backpack button says 'Add to cart' again, without a reload

### TC-MENU-002

**All Items returns to the product list from the cart**

- **Type:** happy · **Technique:** use-case · **Priority:** P3 (Navigation helper)
- **Automation:** ui, CI stage nightly. Cheap
- **Source:** R-MENU-1
- **Status:** suggested

Preconditions:

- Logged in, on the cart page

Steps:

1. Open the menu
2. Click 'All Items'

Expected:

- URL is https://www.saucedemo.com/inventory.html

### TC-MENU-003

**About opens the Sauce Labs site**

- **Type:** happy · **Technique:** use-case · **Priority:** P3 (External link)
- **Automation:** ui, CI stage nightly. Check the link target only, do not load the external site in CI
- **Source:** R-MENU-2
- **Status:** suggested

Preconditions:

- Logged in, on the product list

Steps:

1. Open the menu
2. Click 'About'

Expected:

- The browser goes to https://saucelabs.com/

## User types (F-USERS)

Risk: **medium**. Four accepted users are built to show bugs, slowness or visual changes; each is a separate equivalence class. Source: login page credentials box.

Rules found:

- **R-USERS-1** Every accepted user except locked_out_user can log in and should be able to buy *(R-LOGIN-3)*

Gaps: Each user type is one partition of valid input, so all cases here are happy-path checks run with a different user. Negative cases per user are covered by F-LOGIN.

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-USERS-001](#tc-users-001) | problem_user can buy two products with correct items and totals | happy | P2 | ui · nightly | approved |
| [TC-USERS-002](#tc-users-002) | error_user can buy two products with correct items and totals | happy | P2 | ui · nightly | approved |
| [TC-USERS-003](#tc-users-003) | performance_glitch_user reaches the product list within the time budget | happy | P3 | ui · nightly | suggested |
| [TC-USERS-004](#tc-users-004) | visual_user sees the same page as standard_user | happy | P3 | ui · nightly | suggested |

### TC-USERS-001

**problem_user can buy two products with correct items and totals**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P2 (A user type the site offers; failures are product bugs to report)
- **Automation:** ui, CI stage nightly. Same test as TC-CO-001 with another user: one data-driven test
- **Source:** R-USERS-1
- **Status:** approved

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: problem_user / secret_sauce; Backpack + Bike Light; Ana / Silva / 86000

Steps:

1. Log in as problem_user
2. Add Backpack and Bike Light
3. Check out with the data
4. Finish

Expected:

- Same results as TC-CO-001: badge 2, 'Total: $43.18', 'Thank you for your order!'

### TC-USERS-002

**error_user can buy two products with correct items and totals**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P2 (A user type the site offers; failures are product bugs to report)
- **Automation:** ui, CI stage nightly. Same data-driven test as TC-USERS-001
- **Source:** R-USERS-1
- **Status:** approved

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: error_user / secret_sauce; Backpack + Bike Light; Ana / Silva / 86000

Steps:

1. Log in as error_user
2. Add Backpack and Bike Light
3. Check out with the data
4. Finish

Expected:

- Same results as TC-CO-001: badge 2, 'Total: $43.18', 'Thank you for your order!'

### TC-USERS-003

**performance_glitch_user reaches the product list within the time budget**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P3 (Speed, not correctness)
- **Automation:** ui, CI stage nightly. A timing check is cheap in a test; the budget needs agreeing first
- **Source:** observations-2.txt: login time
- **Assumption:** A 3-second budget (Q-09)
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Test data: performance_glitch_user / secret_sauce. Measured today: about 5,050 ms vs 52 ms for standard_user

Steps:

1. Log in as performance_glitch_user
2. Measure the time from clicking Login to the product list

Expected:

- Product list shown in under 3,000 ms

### TC-USERS-004

**visual_user sees the same page as standard_user**

- **Type:** happy · **Technique:** equivalence-partitioning · **Priority:** P3 (Visual only)
- **Automation:** ui, CI stage nightly. Visual comparison (toHaveScreenshot) if a visual tool is chosen
- **Source:** R-USERS-1; automation-guide.md visual changes
- **Status:** suggested

Preconditions:

- A reference screenshot of the product list as standard_user

Steps:

1. Log in as visual_user
2. Compare the product list with the reference screenshot

Expected:

- No visual difference from the standard_user product list, apart from dynamic content

## Browsers, devices and accessibility (F-CROSS)

Risk: **medium**. The same journey must work for every buyer. Source: references/web-checklist.md; inventory/www-saucedemo-com.json: consoleErrors.

Gaps: Checklist items, no input of their own.

| ID | Title | Type | Priority | Automation | Status |
|---|---|---|---|---|---|
| [TC-CROSS-001](#tc-cross-001) | Two-product purchase works in Firefox and WebKit (Safari) | happy | P2 | ui · nightly | suggested |
| [TC-CROSS-002](#tc-cross-002) | Two-product purchase works at phone size | edge | P2 | ui · nightly | suggested |
| [TC-CROSS-003](#tc-cross-003) | Login and purchase can be done with the keyboard only | edge | P2 | manual · release | suggested |
| [TC-CROSS-004](#tc-cross-004) | Automated accessibility scan finds no serious issues on the main pages | edge | P3 | ui · nightly | suggested |
| [TC-CROSS-005](#tc-cross-005) | Main pages load without console errors | edge | P3 | ui · nightly | suggested |

### TC-CROSS-001

**Two-product purchase works in Firefox and WebKit (Safari)**

- **Type:** happy · **Technique:** checklist · **Priority:** P2 (Buyers use every browser)
- **Automation:** ui, CI stage nightly. Same test, more browser projects
- **Source:** web-checklist.md browsers
- **Status:** suggested

Preconditions:

- Same as TC-CO-001

Steps:

1. Run TC-CO-001 in Firefox
2. Run TC-CO-001 in WebKit

Expected:

- Same results as TC-CO-001 in both browsers: 'Total: $43.18', 'Thank you for your order!'

### TC-CROSS-002

**Two-product purchase works at phone size**

- **Type:** edge · **Technique:** checklist · **Priority:** P2 (Mobile buyers)
- **Automation:** ui, CI stage nightly. Same test, mobile project
- **Source:** web-checklist.md browsers and devices
- **Status:** suggested

Preconditions:

- Same as TC-CO-001, viewport 390 x 844 (phone)

Steps:

1. Run TC-CO-001 on a phone-sized screen

Expected:

- Same results as TC-CO-001; every button is visible and can be tapped

### TC-CROSS-003

**Login and purchase can be done with the keyboard only**

- **Type:** edge · **Technique:** checklist · **Priority:** P2 (Accessibility of the money journey)
- **Automation:** manual, CI stage release. Focus visibility needs a person; repeat before each release
- **Source:** web-checklist.md accessibility
- **Status:** suggested

Preconditions:

- Logged out, on https://www.saucedemo.com/

Steps:

1. Using only Tab, Shift+Tab, Enter and Space: log in, add a product, check out, finish

Expected:

- Every step is reachable
- The focus is always visible
- The order is completed: 'Thank you for your order!'

### TC-CROSS-004

**Automated accessibility scan finds no serious issues on the main pages**

- **Type:** edge · **Technique:** checklist · **Priority:** P3 (Catches regressions; finds about a third of issues)
- **Automation:** ui, CI stage nightly. Runs inside the UI tests if @axe-core/playwright is chosen
- **Source:** web-checklist.md accessibility; automation-guide.md extras
- **Status:** suggested

Preconditions:

- Logged in as standard_user

Steps:

1. Scan login, product list, cart, checkout step one and step two with axe-core

Expected:

- No violations with impact 'serious' or 'critical'

### TC-CROSS-005

**Main pages load without console errors**

- **Type:** edge · **Technique:** checklist · **Priority:** P3 (Errors may hide broken features)
- **Automation:** ui, CI stage nightly. Cheap listener in the UI tests
- **Source:** inventory/www-saucedemo-com.json and inventory-logged-in/www-saucedemo-com-inventory-html.json: consoleErrors
- **Assumption:** Today there are two 401 errors on the login page and one 404 on the product list (Q-08)
- **Status:** suggested

Preconditions:

- Logged out, browser console open or recorded

Steps:

1. Open the login page
2. Log in and open the product list

Expected:

- No console errors on either page

## Not covered

| Area | Reason |
|---|---|
| Dynamic Catalog menu (Lazy Load, Spinner, Slider) | Found in the menu during this run; not explored. Next step: map it and add cases for loading states. |
| Unit tests | No access to the source code |
| API tests | The site has no public API; everything runs in the browser |
| Real payment and order storage | The demo has no payment step and no visible order history |
| Security beyond smoke checks | Not authorised for a security test of a third-party site |
