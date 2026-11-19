# Questions for the team: SauceDemo (Swag Labs)

These are not bugs. The product does not say what should happen, or it does something that looks surprising. The team decides.

| ID | Question | Why it matters | Source | Cases |
|---|---|---|---|---|
| Q-01 | Should checkout be possible with an empty cart? Today a $0.00 order completes, and the item total shows '$0' instead of '$0.00'. | Creates empty orders; the price format is inconsistent | observations.json: emptyCartCheckoutUrl, co_emptyCart_step2, emptyCartFinish | TC-CO-008, TC-CO-011 |
| Q-02 | Should names and postal codes made only of spaces be refused? | Orders with blank names cannot be delivered | observations.json: co_spacesOnly | TC-CO-007 |
| Q-03 | After Reset App State, the cart is emptied but the product buttons keep saying 'Remove' until a reload. Is that intended? | The screen disagrees with the cart; a click on 'Remove' then does nothing useful | observations.json: afterReset; observations-2.txt: before/after reload | TC-MENU-001 |
| Q-04 | Is tax 8% of the item total, rounded half up to the cent? Where is the rule written? | Money expectations need a written rule, not an inference | R-CO-2 (inferred from three totals) | TC-CO-003 |
| Q-05 | What are the maximum lengths and allowed characters for First Name, Last Name and Postal Code? | Boundary cases need the limits | R-CO-5 | TC-CO-010 |
| Q-06 | Should spaces around the username be trimmed? | Pasted usernames fail today | observations.json: spaces | TC-LOGIN-008 |
| Q-07 | Should the order confirmation page open when no order was placed? | Shows 'Thank you for your order!' without an order | inventory-logged-in/inventory.md: checkout-complete | TC-CO-012 |
| Q-08 | The login page logs two 401 errors and the product list one 404. Are these expected? | Console noise hides real errors in automated checks | inventory/www-saucedemo-com.json and inventory-logged-in/www-saucedemo-com-inventory-html.json: consoleErrors | TC-CROSS-005 |
| Q-09 | What is the time budget for reaching the product list after login? | performance_glitch_user takes about 5 seconds; a test needs a number | observations-2.txt: login time | TC-USERS-003 |
| Q-10 | Should the sort choice be kept after viewing a product? How are ties on price ordered? | Today the sort resets to A to Z; tie order is undocumented | observations-2.txt: sort after back, lohi order | TC-CAT-005, TC-CAT-007 |
| Q-11 | Should the cart be kept after logout? | On a shared computer the next user sees the cart | R-CART-3 | TC-CART-006 |
| Q-12 | A product URL with an unknown ID (id=99) shows 'ITEM NOT FOUND' with price '$√-1' and a working Add to cart. The cart badge then shows 1 while the cart list is empty. Intended? | A non-existent item can be put in the cart; badge and cart disagree. Checkout with it was not checked | observations-3.txt, observations-4.txt; inventory/unknown-item-1-product-page.jpg, inventory/unknown-item-2-cart-empty-list.jpg | TC-CAT-008, TC-CART-008 |
