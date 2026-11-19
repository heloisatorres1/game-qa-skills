# Output format: test-cases.json

`test-cases.json` is the single source of truth. `scripts/build-cases.mjs` checks it and generates `test-cases.md`, `test-cases.csv`, `coverage.md` and `questions.md`. Edit the JSON, never the generated files.

```json
{
  "run": {
    "product": "SauceDemo",
    "version": "public demo as of 2026-11-19",
    "date": "2026-11-19",
    "scope": "Login, catalog, cart and checkout",
    "summary": "A practice online shop: log in, pick products, pay. Users are shoppers.",
    "inputs": [
      { "kind": "url", "ref": "https://www.saucedemo.com/" }
    ],
    "risks": ["Checkout total is money", "Login gates everything"],
    "existing_tests": "None found (site only, no code).",
    "approval": { "status": "pending" }
  },
  "features": [
    {
      "id": "F-LOGIN",
      "name": "Login",
      "risk": "high",
      "risk_reason": "Every other feature needs it",
      "sources": ["https://www.saucedemo.com/ (inventory/login.json)"],
      "rules": [
        { "id": "R-LOGIN-1", "text": "Username and password are both required", "source": "error messages seen on the login page" }
      ],
      "gaps": "No password reset on this site."
    }
  ],
  "cases": [
    {
      "id": "TC-LOGIN-001",
      "feature": "F-LOGIN",
      "title": "Standard user logs in and sees the product list",
      "type": "happy",
      "technique": "equivalence-partitioning",
      "priority": "P1",
      "priority_reason": "Login gates the whole shop",
      "preconditions": ["Logged out, on https://www.saucedemo.com/"],
      "data": "standard_user / secret_sauce",
      "steps": ["Type the username", "Type the password", "Click Login"],
      "expected": ["URL is /inventory.html", "Title 'Products' is shown", "6 products are listed"],
      "automation": { "level": "ui", "reason": "Main journey, runs on every change", "ci_stage": "push" },
      "source": "R-LOGIN-1; accepted usernames listed on the login page",
      "assumption": "",
      "status": "suggested"
    }
  ],
  "questions": [
    {
      "id": "Q-01",
      "question": "Should checkout be possible with an empty cart?",
      "source": "https://www.saucedemo.com/checkout-step-two.html shows Total: $0.00 with no items",
      "why": "Creates empty orders",
      "cases": ["TC-CHECKOUT-009"]
    }
  ],
  "not_covered": [
    { "area": "Payment provider", "reason": "The demo has no real payment step" }
  ]
}
```

## Fields

### run

| Field | Required | Notes |
|---|---|---|
| `product`, `date`, `scope`, `summary` | yes | `date` as YYYY-MM-DD |
| `inputs` | yes | each `{kind, ref}`; `kind` = `url`, `code`, `api`, `doc`, `build` |
| `risks` | yes | what hurts most if it breaks |
| `existing_tests` | no | what already exists, so cases are not repeated |
| `approval` | yes | `status`: `pending`, `partial`, `approved`, `rejected`. Phase B adds `by`, `date`, `tools` (the chosen tools), `notes` |

### features

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `F-<NAME>` |
| `name`, `risk`, `risk_reason` | yes | `risk`: `high`, `medium`, `low` |
| `sources` | yes | where the feature was seen or read |
| `rules` | no | each `{id, text, source}`; cases point to them |
| `gaps` | no | why a group (negative, edge) does not apply, or what was not reachable |

### cases

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `TC-<FEATURE>-<NNN>`, unique |
| `feature` | yes | a feature `id` |
| `title` | yes | what + condition + result |
| `type` | yes | `happy`, `negative`, `edge` |
| `technique` | yes | `equivalence-partitioning`, `boundary-value`, `decision-table`, `state-transition`, `use-case`, `error-guessing`, `checklist` |
| `priority`, `priority_reason` | yes | `P1`, `P2`, `P3` |
| `preconditions` | yes | list; the starting state anyone can reach |
| `data` | no | exact test data |
| `steps` | yes | list, one action each |
| `expected` | yes | list of exact results; vague words are refused |
| `automation` | yes | `level`: `unit`, `api`, `ui`, `manual`; `reason`; `ci_stage`: `push`, `pr`, `nightly`, `release`, `none` |
| `source` | yes | rule id, `file:line`, URL or document section |
| `assumption` | no | set when the product does not say what should happen |
| `status` | yes | `suggested` (default), `approved`, `rejected`, `changed` |
| `review_note` | no | the user's comment when rejected or changed |

### questions and not_covered

Each question: `id` (`Q-NN`), `question`, `source`, `why`, optional `cases`. Each not-covered row: `area`, `reason`.

## CSV columns

`ID, Feature, Title, Type, Technique, Priority, Priority reason, Preconditions, Steps, Test data, Expected result, Automation level, Automation reason, CI stage, Source, Assumption, Status`

Steps and expected results are numbered lines inside one cell. UTF-8 with a byte order mark, so Excel opens accents correctly.
