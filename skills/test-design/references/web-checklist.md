# Web checklist

Cross-cutting checks for websites and web apps. These are ideas, not a script: add only the items that matter for **this** product, as normal cases with technique `checklist`. Most belong to P2 or P3 unless they touch money, login or data.

## Forms and input

- Required fields left empty, one at a time and all at once.
- Each limit at min-1, min, max, max+1 (`maxlength`, `min`, `max`, `pattern`).
- Spaces only; leading and trailing spaces; pasted text.
- Accents, emoji and other scripts in names (José, Zoë, 李雷).
- Email and phone formats: valid, missing @, spaces, plus sign (`a+b@x.com`).
- Numbers: 0, negative, decimals, comma vs dot, very large.
- Dates: today, past, future, 29 February, end of month, other time zones.
- Error messages: clear, next to the field, gone once fixed.
- Submit with the Enter key, and with the button.
- Double click on submit: one action only (one order, one payment, one account).

## Navigation and state

- Back button after a submit: no double submit, no broken page.
- Refresh in the middle of a flow (checkout, wizard).
- Open the same page in two tabs and act in both.
- Deep link straight to a step that needs an earlier step (for example /checkout-step-two without a cart).
- Logged-out user opens a logged-in URL: sent to login, then back to the page after login.
- Session timeout during a flow.
- 404 page for a wrong URL; links that go nowhere.

## Accounts and permissions

- Valid, wrong password, unknown user, locked user, user with no permission.
- Log out, then use the back button: private data must not show.
- One user cannot see or change another user's data by changing an ID in the URL.

## Money and numbers

- Totals, taxes, discounts and rounding checked against the rule, to the cent.
- Currency shown the same way everywhere.
- Empty cart, one item, many items, the maximum quantity.

## Browsers and devices

- Chromium (Chrome, Edge), Firefox, WebKit (Safari).
- Phone width (360 px and 390 px), tablet, laptop (1280 px), large screen.
- Touch: tap targets large enough, no hover-only actions.
- Rotation on phones.

## Accessibility

- Keyboard only: every action reachable with Tab and Enter, focus visible, logical order.
- Images have useful alt text; buttons and fields have names (labels).
- Colour contrast; nothing told by colour alone.
- Zoom to 200%: still usable.
- An automated scan (axe-core) catches about a third of issues; the rest needs a person.

## Network and errors

- Slow network (throttled 3G): loading states, no double actions.
- Offline, then back online.
- A server error (500) or timeout: a friendly message, no lost data.
- Console errors on each page.

## Security basics (only on your own or authorised systems)

- Script text in a field (`<script>alert(1)</script>`) is shown as text, not run.
- Error messages do not reveal whether an account exists, or stack traces.
- Password fields are masked; nothing secret in the URL.
- These are smoke checks. A real security test is a separate, authorised job.

## Content

- Page titles, spelling, broken images, placeholder text left in ("Lorem ipsum", "TODO"). The `text-review` skill does this in depth.
