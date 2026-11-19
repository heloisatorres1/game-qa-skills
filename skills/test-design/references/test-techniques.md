# Test techniques

How to turn a rule into test cases. Pick the technique that fits the rule and write its name on the case (`technique` field). These are the classic ISTQB black-box techniques plus two experience-based ones.

## The three groups

| Group | What it is | Example (online shop) |
|---|---|---|
| **Happy path** (`happy`) | Everything correct, the way a normal user does it. | Log in, add two products, check out, see "Thank you for your order!" |
| **Negative path** (`negative`) | Wrong or forbidden input or action. The system refuses it with a clear message and keeps the data safe. | Wrong password; locked account; checkout with no name. |
| **Edge case** (`edge`) | The extremes and the unusual: boundaries, empty, one, many, very long, special characters, timing. | Cart with 0, 1 and all products; a 255-character name; double-clicking Pay. |

Every feature gets at least one happy case. Most features with input or state also need negative and edge cases. If a group does not apply, say why in the feature's `gaps`.

## Techniques

### Equivalence partitioning (`equivalence-partitioning`)

Group inputs that the system treats the same way, then test **one value from each group**. Each invalid group gets its own case.

> Rule: age must be 18 to 65.
> Groups: below 18 (invalid), 18 to 65 (valid), above 65 (invalid), not a number (invalid), empty (invalid).
> Cases: 30 (happy), 10, 70, "abc", empty (negative).

Use it for user types too: a valid user, a locked user, an unknown user. No need to test 50 valid users.

### Boundary value analysis (`boundary-value`)

Bugs hide at the edges. Test **just below, on, and just above** each limit.

> Rule: name is 1 to 50 characters.
> Cases: 0 (empty, refused), 1 (accepted), 50 (accepted), 51 (refused or cut to 50: check which the rule says).

Where to find limits: `maxlength`, `min`, `max`, `minlength`, `pattern` in HTML; validators in code (`.max(50)`, `@Size(max=50)`, `max_length=50`); database column sizes; the document's numbers. `scan-rules.mjs` and `page-inventory.js` list them.

If the limit is not written anywhere, do not invent it. Write a question, and one edge case with a clearly long value (for example 1,000 characters) marked as an `assumption`.

### Decision table (`decision-table`)

Use it when **several conditions combine** to decide the result. List the conditions, the combinations that matter, and the expected result for each.

> Rule: free shipping if the order is over $50 **and** the address is domestic, or if the user is a member.
>
> | Over $50 | Domestic | Member | Free shipping |
> |---|---|---|---|
> | yes | yes | no | yes |
> | yes | no | no | no |
> | no | yes | no | no |
> | no | no | yes | yes |

Each meaningful row is one case. Drop rows that cannot happen and say so.

### State transition (`state-transition`)

Use it when something **moves between states**: an order (cart, paid, shipped, delivered, cancelled), an account (active, locked), a form wizard, a game level (locked, open, completed).

- Test each **valid** move once (happy).
- Test **invalid** moves (negative): cancel a delivered order, pay twice, skip a wizard step through the URL.
- Test what survives a **reload, back button or a second tab** (edge).

### Use case / user journey (`use-case`)

The main path a real user takes from start to goal, across screens. These become the few end-to-end UI tests. Add the main alternative paths (pay by another method, edit the cart before paying).

### Error guessing (`error-guessing`)

Experience-based: things that often break. Double submit, back after submit, refresh in the middle of a flow, pasting text with spaces at the ends, emoji and accented names (José, Zoë, 李), very old or future dates, time zones, a closed session, an expired link. Write in `source` why you expect it can break.

### Checklist (`checklist`)

Cross-cutting checks that apply to every product of a type: browsers, screen sizes, accessibility, security basics. Use [web-checklist.md](web-checklist.md) for web. Add only the items that matter for this product, as normal cases.

## Writing a good case

| Field | Good | Bad |
|---|---|---|
| Title | "Login with a wrong password shows an error and stays on the login page" | "Login test 2" |
| Steps | Numbered, one action each, from a state anyone can reach | "Try to log in wrong" |
| Expected | "Error 'Epic sadface: Username and password do not match any user in this service' appears; URL stays /" | "Error is shown", "works" |
| Test data | "Password: `wrong_pass`" | "an invalid password" |
| Source | `login.js:42 checks credentials`; "spec §2.1"; "https://site/ login form" | (empty) |

## Bug or question?

When the product does something that **looks** wrong but no rule says it is wrong, it is a **question** for the team, not a bug and not a failed case. Example: a shop that lets you check out an empty cart for $0.00. Write it in `questions`, and write the case with `assumption` set to the behaviour you think is right.
