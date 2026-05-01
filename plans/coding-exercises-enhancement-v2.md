# Coding Exercise Enhancement Plan — v2

## Current State

| Metric | Count |
|--------|-------|
| **Total exercises** | 36 |
| **Basic** | 8 (IDs: 18-22, 28-30) |
| **Intermediate** | 20 (IDs: 1-17, 31-33) |
| **Advanced** | 8 (IDs: 23-27, 34-36) |

## Part A — New Exercises (+14)

Goal: Rebalance the distribution toward **Basic** and **Advanced**, filling content gaps from the source markdown files.

### Basic (add 5) → 8 → 13

| # | Title | Lang | Source Concept |
|---|-------|------|----------------|
| 1 | `match` Basics — Simple Assertions | gherkin | `match a == b`, `match a contains b`, `match a != b` |
| 2 | Working with JSON Objects | gherkin | `* def`, create nested JSON, access fields with dot notation |
| 3 | The `request` Keyword | gherkin | Sending structured payloads with `And request` |
| 4 | `Then status` with Different Codes | gherkin | 200, 201, 204, 404 — what each means |
| 5 | Using `And header` for Custom Headers | gherkin | Setting `Authorization`, `Content-Type`, custom headers |

**Source material**: `business_overview.md` Pet/Store/User domain descriptions, `README.md` basic HTTP examples.

### Intermediate (add 3) → 20 → 23

| # | Title | Lang | Source Concept |
|---|-------|------|----------------|
| 1 | Tag Composition — AND/OR/NOT | gherkin | `.tags("@smoke", "~@slow")`, tag combinations in runners |
| 2 | Deep Clone with `copy` vs `def` Reference | gherkin | `copy` keyword, mutation isolation, `set` on cloned objects |
| 3 | `callSingle` Shared Session Pattern | javascript | OAuth token caching, `karate.callSingle()` in `karate-config.js` |

**Source material**: `README.md` lines 293-299 (`callSingle`), 359-375 (tagging strategy), 837-847 (`copy` vs `def`).

### Advanced (add 6) → 8 → 14

| # | Title | Lang | Source Concept |
|---|-------|------|----------------|
| 1 | Programmatic `karate.match()` | gherkin | Non-throwing schema match returning `{pass, message}` |
| 2 | Schema Composition with `schema-utils.js` | javascript | `merge`, `pick`, `makeOptional`, `withField`, `without` |
| 3 | The `text` Keyword — Raw String Assignment | gherkin | Bypass XML parsing for HTML/raw text in triple quotes |
| 4 | `karate.fromString()` after `replace` | gherkin | `replace` → string → `karate.fromString()` → JSON |
| 5 | Nightly Regression CI/CD Runner | yaml | Scheduled pipeline, `-Pregression`, `github.ref == 'main'` |
| 6 | `configure retry` + Defensive Assertions | gherkin | Demo API reliability patterns, `retry until`, `##string` matchers |

**Source material**: `README.md` lines 424-462 (karate.match), 435-462 (schema-utils), 906-920 (text keyword), 882-890 (replace), 1063-1070 (nightly), 968-982 (defensive assertions).

---

### Exercise Implementation Template

Each new exercise follows the existing pattern:

```javascript
add(++id, 'Title', 'language',
    '```lang\n' +
    'code here\n' +
    '```',
    'Description of the concept and what it demonstrates.',
    'Practice: actionable practice instruction.',
    'difficulty-level',
    ['Hint 1 — gentle nudge',
     'Hint 2 — more specific direction',
     'Hint 3 — almost the answer']
);
```

---

## Part B — UI/UX Enhancements

### B1 — Empty State Message (`renderers.js`)
**Current**: When filter matches zero exercises, cards disappear but no message shown.
**Change**: After filtering in [`handleSearch()`](app/js/main.js:58), if no `.exercise-card` is visible, show a centered message: "No exercises match your filter. Try a different search term or filter."

### B2 — Search Highlighting in Titles/Descriptions (`renderers.js` + `main.css`)
**Current**: Search filters cards but doesn't highlight matching text.
**Change**: When search text is entered, wrap matching substrings in `<mark class="ex-search-highlight">` in exercise titles and descriptions. Toggle highlight class on/off with search input.

### B3 — Filter Chip Counts (`main.js`)
**Current**: Chips show label only (e.g., "Basic", "gherkin").
**Change**: Append count badge to each chip: "Basic (13)", "gherkin (9)", "Intermediate (23)".

**Relevant code**: [`renderFilterChips()`](app/js/main.js:99-120) builds chip buttons.

### B4 — Difficulty Badge Tooltip (`renderers.js`)
**Current**: Badge shows icon + label (e.g., "🟢 Basic").
**Change**: Add `title` attribute on the difficulty badge span with explanation text:
- Basic: "Foundational — no prior Karate experience needed"
- Intermediate: "Standard — common real-world patterns"
- Advanced: "Challenging — multi-step concepts and edge cases"

### B5 — Escape Key to Close Solution/Hint (`renderers.js`)
**Current**: Only button clicks can close solution panels.
**Change**: Add a global `keydown` listener when entering a mode that listens for `Escape`. When pressed, close any open solution panel or hint area in the viewport.

### B6 — Staggered Card Entrance Animation (`main.css`)
**Current**: Cards render instantly.
**Change**: Add `@keyframes cardFadeIn` animation with incremental `animation-delay` based on card index (using CSS custom property `--card-index`). Each card slides up 20px and fades in.

### B7 — Quick-Nav Jump List (`renderers.js` + `main.css`)
**Current**: Users must scroll through all exercises to find a specific one.
**Change**: Add a compact floating quick-nav bar showing exercise numbers. Click a number to `scrollIntoView()` for that card. Show on hover over a small toggle button.

### B8 — Bookmark / Mark for Review (`renderers.js` + `main.js`)
**Current**: Only two statuses: solved / unsolved (+ in_progress).
**Change**: Add a "⭐ Bookmark" button on each card. Bookmarked exercises appear in a new filter chip "Bookmarked". Uses localStorage key `exercise_bookmarks` as an array of IDs.

---

## Part C — Files to Modify

| File | Changes |
|------|---------|
| [`app/js/parser.js`](app/js/parser.js) | Add 14 new `add(++id, ...)` calls (lines ~193-935) |
| [`app/js/renderers.js`](app/js/renderers.js) | B1 (empty state), B2 (search highlight), B4 (tooltips), B5 (Escape key), B7 (quick-nav), B8 (bookmark) |
| [`app/js/main.js`](app/js/main.js) | B3 (filter chip counts), B5 (keyboard listener), B8 (bookmark filter chip) |
| [`app/css/main.css`](app/css/main.css) | B2 (highlight style), B6 (card animation), B7 (quick-nav styles), B8 (bookmark star style) |

---

## Execution Order

1. **Phase 1 — New Exercises**: Add all 14 new exercises to [`parser.js`](app/js/parser.js).
2. **Phase 2 — Core UI Fixes**: Empty state (B1), Search highlighting (B2), Filter chip counts (B3), Tooltips (B4).
3. **Phase 3 — Interaction Enhancements**: Escape key (B5), Bookmark system (B8).
4. **Phase 4 — Polish**: Card animations (B6), Quick-nav jump (B7).

---

## Final State After Plan

| Metric | Before | After |
|--------|--------|-------|
| Basic | 8 | 13 |
| Intermediate | 20 | 23 |
| Advanced | 8 | 14 |
| **Total** | **36** | **50** |
| UI enhancements | 0 | 8 features |
