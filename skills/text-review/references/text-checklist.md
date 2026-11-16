# Text checklist

Tick through these per batch. Items marked (L) are for localised builds.

## Spelling and words
- [ ] Misspelled words, including common game words (achievement, receive, separate, definitely, inventory)
- [ ] Item, character, level and currency names spelled identically everywhere
- [ ] Missing or doubled words ("the the", "you to need")
- [ ] Wrong homophones (its/it's, your/you're, their/there, lose/loose, then/than)
- [ ] Spelling variant consistent (US or UK, not both)
- [ ] (L) Untranslated strings left in the reference language
- [ ] (L) Text in the wrong language on a screen

## Grammar
- [ ] Subject/verb agreement
- [ ] Articles (a/an, missing "the")
- [ ] Singular/plural with numbers, including runtime values (`{…} coins` when the value can be 1)
- [ ] Consistent tense and person in instructions (imperative "Tap the block", not mixed with "You tap...")
- [ ] (L) Gender/case agreement with variables

## Punctuation and typography
- [ ] Sentences in the same element type end consistently (all toasts with "!" or none)
- [ ] No space before `, . ! ? :` (English); required non-breaking space before `! ? :` (French) (L)
- [ ] Balanced quotes and brackets
- [ ] One ellipsis style ("..." or "…")
- [ ] One apostrophe/quote style (straight or curly)
- [ ] Number formatting consistent (1,000 vs 1000; decimal separator per locale (L))
- [ ] Time/date formats consistent and clear ("10 s", "10s", "10 sec")

## Capitalisation
- [ ] Buttons: one style (Title Case or Sentence case)
- [ ] Screen and popup titles: one style
- [ ] Feature names: same capitalisation in menus, tutorials and tooltips
- [ ] ALL CAPS only where it is clearly a style choice (and consider CSS `text-transform` before flagging)

## Meaning and consistency
- [ ] One term per concept (glossary)
- [ ] Instructions match the actual controls (tap vs click, key names, gamepad buttons)
- [ ] Numbers in text match the game data (reward amounts, prices, timers, level counts)
- [ ] Unlock conditions in text match the real conditions
- [ ] Error and empty-state messages tell the player what to do next

## Leftovers and leaks
- [ ] TODO, FIXME, lorem ipsum, "test", "asdf", internal codenames
- [ ] `undefined`, `NaN`, `null`, `[object Object]`, raw keys like `ui.store.title`
- [ ] Developer-facing wording visible to players ("Test purchase", "Demo ad") when it is not intended. Ask: in a prototype these may be deliberate (`type: query`)

## In context (needs the running game)
- [ ] Truncated or clipped text, text overflowing its box
- [ ] Missing glyphs (boxes/tofu), wrong font fallback, emoji not rendering
- [ ] Text overlapping art or other UI
- [ ] Text readable on its background (contrast)
- [ ] Longest language fits (L)
