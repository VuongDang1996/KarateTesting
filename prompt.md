# AI Master Prompt: Universal Markdown-to-IDE Learning Lab

**Objective:**
I want you to act as an expert frontend developer and web designer. Your goal is to build a local, highly interactive "Learning Lab" web application. This application must dynamically read existing Markdown documentation files (from any folder, e.g., `docs/` or `Learning/`) and transform them into an interactive learning experience complete with reading tabs, flashcards, quizzes, and a full IDE-like coding practice environment.

**Universal Framework Support:**
This architecture must be **framework-agnostic**. It should perfectly adapt whether the Markdown files are teaching **Python, Selenium (Java), Playwright (TypeScript), Cypress, Karate, or pure SQL**. The system must detect the language from the Markdown code blocks and configure the syntax highlighters and IDE engines accordingly.

Please build this using a Vanilla stack (HTML, CSS, ES6 JavaScript) without a build step (no React/Next.js/Webpack). It should run directly from a local HTTP server (e.g., `python -m http.server`).

---

## 1. Architecture & Tech Stack
*   **Core:** `index.html`, `css/main.css`, `js/main.js` (using ES modules).
*   **Markdown Parsing:** Use the `marked.js` CDN to parse raw markdown into HTML.
*   **Static Syntax Highlighting:** Use `Prism.js` (via CDN). Configure it to load standard languages (Java, Python, JS/TS, Bash, YAML, JSON, etc.) to handle static code blocks in the reading views.
*   **IDE Engine:** Use `Monaco Editor` (VS Code's engine) via CDN for the interactive coding exercises. It inherently supports intelligent autocompletion and highlighting for dozens of languages.
*   **State Management:** Use the browser's `localStorage` to save user progress, theme preference, editor code states, and spaced repetition data.
*   **File Fetching:** The app must use `fetch()` to dynamically load an array of markdown files at startup.

---

## 2. UI/UX & Aesthetics (CRITICAL)
The design must be modern, premium, and visually stunning. Do not build a basic prototype.
*   **Aesthetics:** Use a Glassmorphism style (translucency, backdrop-blur) for the navbar, cards, and floating UI elements.
*   **Colors & Themes:** Implement a sleek Dark Mode by default (e.g., `#0d1117` or `#111827` backgrounds), with a toggle for Light Mode. Use CSS variables (`--bg`, `--text`, `--accent`) for easy theming. Accent colors should be vibrant gradients (e.g., blue-to-purple).
*   **Typography:** Import Google Fonts. Use `Inter` or `Roboto` for standard text and `JetBrains Mono` or `Fira Code` for all code elements.
*   **Layout:**
    *   **Sticky Header:** Logo, App Title, Status Indicator, Theme Toggle.
    *   **Document Tabs:** A horizontal scrollable bar to switch between reading different markdown files.
    *   **Interactive Learning Tab:** A dedicated tab containing three sub-modes: Flashcards, Quizzes, and Coding Exercises.
    *   **Dashboard:** A persistent progress bar and statistics section tracking mastered flashcards, quiz scores, and solved exercises. Group coding exercises by difficulty (Basic, Intermediate, Advanced).

---

## 3. The Parser Engine (`js/parser.js`)
Write a custom extraction engine using Regex to parse the fetched markdown text. It must be flexible enough to handle any subject matter.

*   **Flashcards Extraction:**
    *   Define a clear markdown syntax, e.g., a blockquote starting with `**Concept:**` or `**Term:**`.
    *   Extract the bolded text as the "Front" and the following text as the "Back". Map these into JSON objects.
*   **Quiz Extraction:**
    *   Extract multiple-choice questions formatted as bulleted lists where checkboxes indicate the correct answer (e.g., `- [ ] Wrong`, `- [x] Correct`).
*   **Coding Exercises Extraction:**
    *   Scan for designated exercise blocks (e.g., headings containing `[Exercise]`).
    *   Extract metadata: `title`, `description`, `difficulty` (Basic/Intermediate/Advanced).
    *   **Language Detection:** Extract the language tag directly from the markdown code block (e.g., ` ```python ` -> `lang: 'python'`). Map custom framework names (like `gherkin` or `playwright`) to their closest Monaco language support (e.g., `java` or `typescript`).
    *   Extract `setup_code` (initial code given to the user) and `solution_code` (the expected answer).

---

## 4. Interactive Learning Modes (`js/renderers.js`)

### A. Flashcard Mode (Spaced Repetition)
*   Render cards in a responsive CSS Grid.
*   **Interaction:** Clicking the card triggers a smooth 3D CSS flip animation (`transform: rotateY(180deg)`).
*   **Spaced Repetition System (SRS):** Once flipped, show 3 buttons (Again, Hard, Easy). Clicking these saves a score (0, 1, 2) to `localStorage` to track mastery on the Dashboard.

### B. Knowledge Quiz Mode
*   Render interactive multiple-choice questions.
*   When a user clicks an option, immediately highlight it (Green for correct, Red for incorrect) and disable further clicks on that question. Show the correct answer if they failed.
*   Update the global quiz score percentage on the dashboard.

### C. The IDE Experience (Coding Exercises)
This is the core feature. Render a list of coding challenges.
*   **Monaco Integration:** For each exercise, initialize a Monaco Editor instance. 
    *   Pass the dynamically extracted `lang` property to Monaco so it highlights Python, Java, or TS correctly.
    *   Bind it to the `setup_code`. 
    *   *Critical Layout Fix:* Ensure the container has `position: relative` and triggers `editor.layout()` whenever the editor's display is toggled from `none` to `block`.
*   **Universal Validation Engine:** 
    *   Create a "Run Validation" button. 
    *   When clicked, run a JavaScript function that evaluates the code inside the Monaco editor against the expected `solution_code`. 
    *   Build a heuristic validator: use `.includes()` or regex to check if the user's code contains key required tokens (e.g., `driver.get()` for Selenium, `page.goto()` for Playwright, `def test_` for Python Pytest).
*   **Dynamic Feedback:** Render a feedback box below the editor. Show a Green success message if the validation passes. If it fails, show a Red bulleted list explaining exactly which keywords or structures are missing.
*   **Solution Reveal:** Provide a button to reveal the official solution, which expands smoothly using CSS transitions.
*   **Auto-save:** Debounce the editor `onDidChangeModelContent` event to auto-save the user's code to `localStorage` so they never lose their work across browser refreshes.

---

## 5. Execution Workflow
When generating the code, please follow this strict order. Do not skip steps.

1.  **File Structure & `index.html`:** Set up the HTML shell, all required CDNs (Marked, Prism, Monaco), and the base UI layout elements.
2.  **`main.css`:** Implement the premium design system, glassmorphism UI, CSS grid/flexbox layouts, 3D animations, and responsive media queries.
3.  **`js/parser.js`:** Write the regex extraction logic to convert raw markdown text into usable JSON arrays (`flashcards`, `quizItems`, `exercises`).
4.  **`js/renderers.js`:** Write the DOM generation logic for the learning modes, handling the complex Monaco Editor initialization, state tracking, and the validation engine.
5.  **`js/main.js`:** Write the core controller logic: `fetch()` initialization for the markdown files, calculating and updating the Dashboard statistics, and wiring up global event listeners (like Search and Filtering).

Please write clean, thoroughly commented code. Ensure robust error handling is in place if the Markdown files fail to load (e.g., 404 errors) and display a graceful error state in the UI.
