# Interactive Learning Lab — Enhancement Plan

## Current State

[`index.html`](index.html) is a 2132-line single-page app with:
- **Markdown viewer** (READme.md + business_overview.md rendered via marked.js)
- **Flashcards** (CSS 3D `rotateY` flip, categorized by concept/gotcha/api/config)
- **Quiz** (accordion toggle + self-marking with correct/wrong tracking)
- **Coding Exercises** (Prism.js syntax highlighting, reveal solution, practice textarea)
- **Tabbed navigation** (Level 1: doc tabs, Level 2: learning mode tabs)

---

## Proposed Enhancements

### 1. 🔍 Global Search & Filter Bar

**Problem:** With ~40 flashcards, 13 quiz items, and 8 exercises, users can't quickly find what they need.

**Solution:** Add a search input + filter chips at the top of each learning mode.

| Feature | Detail |
|---|---|
| **Search input** | Debounced (300ms) real-time filtering across question/answer/code content with match highlighting |
| **Category filter chips** | Clickable pills: *All*, *Concept*, *Gotcha*, *API*, *Config* — filters flashcard grid in-place with animation |
| **Quiz filter** | Filter by "Unanswered", "Correct", "Wrong" with a tab-like toggle |
| **Exercise filter** | Filter by language (gherkin, java, javascript, yaml) |

**CSS needed:** Search bar styles, filter chip active state, match highlight (`<mark>` element styling), exit animation for filtered-out items.

**JS needed:** `filterFlashcards(category)`, `filterExercises(lang)`, `searchAll(query)` with `RegExp` matching.

---

### 2. 🌗 Dark Mode with Persistent Preference

**Problem:** The indigo/white palette causes eye strain in low-light environments.

**Solution:** Add a sun/moon toggle in the header. Define all colors as CSS custom properties. Toggle a `data-theme="dark"` attribute on `<html>`.

**Implementation:**

```css
:root {
  --bg-page: #f0f2f5;
  --bg-card: #ffffff;
  --text-primary: #1a1a2e;
  /* ... light palette */
}

[data-theme="dark"] {
  --bg-page: #0f1117;
  --bg-card: #1a1b26;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --border: #30363d;
  --bg-code: #0d1117;
  --bg-tab: #21262d;
  /* ... dark palette overrides */
}
```

**Storage:** Save to `localStorage.setItem('theme', 'dark'|'light')` on toggle, read on `DOMContentLoaded`.

**Transition:** Add `transition: background-color 0.3s, color 0.3s` on `body`.

---

### 3. 🔄 Spaced Repetition for Flashcards

**Problem:** All flashcards display identically regardless of user mastery. No way to focus on weak areas.

**Solution:** Add "👍 Got it" / "🔄 Review Later" buttons on each flashcard back. Track state in `AppData.flashcardProgress: { [index]: 'mastered' | 'reviewing' | 'new' }`.

| Concept | Implementation |
|---|---|
| **Mastery levels** | `new` (default, always shown), `reviewing` (shown every other session), `mastered` (shown 1/5 of the time) |
| **Filter bar addition** | "All", "Needs Review", "Mastered" filter tabs |
| **Session counter** | Increment on each page load; `mastered` cards shown only when `sessionCount % 5 === 0` |
| **Persistence** | Save `flashcardProgress` + `sessionCount` to localStorage |
| **Storage key** | `karateLab.flashcardProgress`, `karateLab.flashcardSessions` |

**UI change:** Each flashcard back gets two new buttons:
```html
<button class="flash-master-btn" onclick="markFlashcard(index, 'mastered')">👍 Got it</button>
<button class="flash-review-btn" onclick="markFlashcard(index, 'reviewing')">🔄 Review Later</button>
```

---

### 4. 💾 Full Progress Persistence (localStorage)

**Problem:** Quiz scores and flashcard progress reset on page refresh.

**Solution:** Namespace all storage under `karateLab.*`.

| Data | Key | Format |
|---|---|---|
| Quiz state | `karateLab.quizState` | `{ correct: 5, wrong: 3, answers: { "1": "correct", "2": "wrong", ... } }` |
| Flashcard mastery | `karateLab.flashcardProgress` | `{ "0": "mastered", "1": "reviewing", ... }` |
| Session count | `karateLab.sessionCount` | `number` |
| Theme preference | `karateLab.theme` | `"light"` or `"dark"` |
| Active learning mode | `karateLab.activeMode` | `"flashcards"`, `"quiz"`, `"coding"` |

**Restore flow on `DOMContentLoaded`:**
1. Read all stored values
2. Restore quiz marks + buttons
3. Restore flashcard mastery badges
4. Apply theme
5. Restore active mode tab

---

### 5. 📊 Auto-Generated Quiz From Tables

**Problem:** The 13 quiz questions are hardcoded. Any table change in the markdown files requires editing the JS.

**Solution:** Write a generic `tableToQuestions(tableHtml, context)` parser that:
1. Parses each table from the markdown
2. For each row, picks a random column as the "question" and another as the "answer"
3. Generates natural-language questions: *"What is the Purpose of the smoke profile?"*

**Implementation steps:**
- Extract all markdown tables using regex (already done partially for flashcards)
- For each table, identify the header row
- For each data row, generate questions using templates:
  - *"What is the {col1} of {row_context}?"*
  - *"Which {row_context} has {col1} = {value}?"*
- Merge with existing hardcoded questions, deduplicate by content hash

**Target tables:** Maven Profiles, Tagging Strategy, API Endpoints, Verification Strategy, File Guide sections

---

### 6. 🖨️ Print-Friendly CSS

**Problem:** The page doesn't render well when printed (sticky headers overlap content, dark code blocks waste ink).

**Solution:** Add a `@media print` block:

```css
@media print {
  .header, .tab-bar { display: none; }
  .doc-content { display: block !important; }
  .mode-content { display: block !important; }
  pre { background: #f5f5f5 !important; color: #000 !important; break-inside: avoid; }
  .flashcard { break-inside: avoid; height: auto; }
  .flashcard-inner { transform: none !important; }
  .flashcard-back { transform: none !important; position: relative; }
  /* ... */
}
```

**Key goals:**
- Show all doc content (no tabs, all sections visible)
- Convert dark code blocks to light (save ink)
- Break flashcard 3D transforms into simple stacked layout
- Add page margins and readable font sizes

---

### 7. 🔗 Section Anchor Links & Table of Contents

**Problem:** Long markdown documents have no navigation — users must scroll manually.

**Solution:** Auto-generate a sticky sidebar ToC from the rendered markdown's `<h1>`, `<h2>`, `<h3>` elements.

**Implementation:**
- After `marked.parse()`, query all heading elements
- Generate a nested `<ul>` list with anchor links
- Use `IntersectionObserver` to highlight the current section as the user scrolls
- Collapsible on mobile (hamburger button)

**For the interactive modes:** Add a floating "back to top" button on scroll.

---

## Implementation Order (Recommended)

| Phase | Items | Dependencies | Est. Complexity |
|---|---|---|---|
| **1 — Core UX** | Search/Filter + Dark Mode + Print CSS | None | Medium |
| **2 — Persistence** | localStorage for quiz + flashcards + theme | Dark Mode, Flashcards buttons | Medium |
| **3 — Learning** | Spaced repetition + Auto quiz from tables | Persistence, Search | High |
| **4 — Navigation** | ToC sidebar + Anchor links + Back-to-top | None | Low |

## Files to Modify

Only one file: [`index.html`](index.html) — all changes are self-contained.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Large file size (already 2132 lines) | Keep CSS/JS modular with clear section comments; avoid unnecessary duplication |
| localStorage key collisions | Use `karateLab.*` namespace prefix |
| Dark mode + syntax highlighting | Prism themes may need swapping — use `prism-tomorrow` for dark, `prism` for light |
| Print layout complexity | Test with browser print preview iteratively |
