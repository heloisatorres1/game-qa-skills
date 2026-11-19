# Questions for the team: Pixel Swarm

These are not bugs. The product does not say what should happen, or it does something that looks surprising. The team decides.

| ID | Question | Why it matters | Source | Cases |
|---|---|---|---|---|
| Q-01 | Should the Special Offer still include No Ads, at full price, for players who already own No Ads? | Players would pay again for an entitlement they have | js/app.js:314-318 vs js/app.js:324 and js/app.js:698 | TC-STORE-006 |
| Q-02 | Should two quick taps on a store item make two purchases, or should there be a confirm step? | Accidental double spends | js/app.js:374-394 (no pending guard) | TC-STORE-011 |
| Q-03 | Is 7 the slot limit for every way of adding a slot, including the Out of Slots offer? | The two paths disagree in code | js/app.js:2122 vs js/app.js:2681 | TC-BOOST-003 |
| Q-04 | Should Level Complete be closable by tapping outside it? If yes, should the reward still be paid? | The reward and the next level depend on Continue or Claim x2 | index.html:423, js/app.js:3028 | TC-WIN-003 |
| Q-05 | How is XP earned, and how much per win? No gameplay code adds XP. | Level-gated skins, avatars and wardrobe items cannot unlock through play | js/app.js:10-12, 151, 575, 2611-2612 | TC-XP-001 |
| Q-06 | What should the profile show when the name is empty or only spaces? | Empty labels look broken | inventory/inventory.md: name-input | TC-NAME-003 |
