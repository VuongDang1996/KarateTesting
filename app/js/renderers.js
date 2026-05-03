import { Storage } from './storage.js';

export function renderFlashcards(cards) {
    var grid = document.getElementById('flashcard-grid');
    var counter = document.getElementById('flashcard-counter');
    if (!cards.length) {
        grid.innerHTML = '<div class="loading"><p>No flashcards generated.</p></div>';
        counter.textContent = '0 cards';
        return;
    }

    // Load SR data
    var srData = Storage.get('flashcard_sr', {});

    cards.forEach(function (c, i) {
        c.id = 'fc_' + c.question.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
        c.mastery = srData[c.id] || 0;
    });

    cards.sort(function (a, b) {
        return a.mastery - b.mastery;
    });

    counter.textContent = cards.length + ' cards';
    grid.innerHTML = cards.map(function (c, i) {
        var catClass = 'cat-' + (c.category || 'concept');
        var masteryStars = '&#x2B50;'.repeat(c.mastery) + '&#x2606;'.repeat(3 - c.mastery);
        var icon = c.category === 'gotcha' ? '&#x26A0;&#xFE0F;' : c.category === 'api' ? '&#x1F517;' : c.category === 'config' ? '&#x2699;&#xFE0F;' : '&#x1F9E0;';

        return '<div class="flashcard" id="' + c.id + '" data-mastery="' + c.mastery + '" onclick="this.classList.toggle(\'flipped\')">' +
            '<div class="flashcard-inner">' +
            '<div class="flashcard-front">' +
            '<div class="flash-icon">' + icon + '</div>' +
            '<span class="flashcard-category ' + catClass + '">' + (c.category || 'concept') + '</span>' +
            '<div class="flash-mastery" style="position:absolute;top:10px;right:10px;font-size:0.75rem;">' + masteryStars + '</div>' +
            '<div class="flash-q">' + c.question + '</div>' +
            '<div class="flash-hint">&#x1F446; tap to reveal</div>' +
            '</div>' +
            '<div class="flashcard-back">' +
            '<div class="flash-label">Answer</div>' +
            '<div class="flash-a">' + c.answer + '</div>' +
            '<div class="flash-source">&#x1F4CE; ' + c.source + '</div>' +
            '<div class="sr-buttons" onclick="event.stopPropagation()">' +
            '<div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">How well did you know this?</div>' +
            '<button class="sr-btn sr-again" onclick="markFlashcard(\'' + c.id + '\', 0)">Again</button>' +
            '<button class="sr-btn sr-hard" onclick="markFlashcard(\'' + c.id + '\', 1)">Hard</button>' +
            '<button class="sr-btn sr-good" onclick="markFlashcard(\'' + c.id + '\', 2)">Good</button>' +
            '<button class="sr-btn sr-easy" onclick="markFlashcard(\'' + c.id + '\', 3)">Easy</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');
}

export function markFlashcard(id, level) {
    var srData = Storage.get('flashcard_sr', {});
    srData[id] = level;
    Storage.set('flashcard_sr', srData);

    var card = document.getElementById(id);
    if (card) {
        card.setAttribute('data-mastery', level);
        var masteryStars = '&#x2B50;'.repeat(level) + '&#x2606;'.repeat(3 - level);
        card.querySelector('.flash-mastery').innerHTML = masteryStars;
        card.classList.remove('flipped');

        card.style.opacity = '0.5';
        setTimeout(function () { card.style.opacity = '1'; }, 300);
    }
    if (window.updateDashboard) window.updateDashboard();
}

export function renderQuiz(items) {
    var list = document.getElementById('quiz-list');
    if (!items.length) {
        list.innerHTML = '<div class="loading"><p>No quiz items generated.</p></div>';
        return;
    }
    
    // Attach the questions globally so we can access them in markQuizMCQ
    window.AppData = window.AppData || {};
    window.AppData.quizItems = items;

    list.innerHTML = items.map(function (q) {
        var codeBlock = '';
        if (q.code) {
            var highlighted = q.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (window.Prism && Prism.languages.javascript) {
                try {
                    highlighted = Prism.highlight(q.code, Prism.languages.javascript, 'javascript');
                } catch (e) {}
            }
            codeBlock = '<div class="quiz-code"><pre><code class="no-highlight">' + highlighted + '</code></pre></div>';
        }

        var optionsHtml = q.options.map(function(opt, index) {
            var safeOpt = opt.replace(/`/g, '<code>').replace(/`/g, '</code>'); // Simple backtick replacement
            if (safeOpt.split('<code>').length % 2 === 0) {
               // Fix unclosed ticks
               safeOpt += '</code>';
            }
            return '<button class="quiz-mcq-opt" onclick="markQuizMCQ(this, ' + q.id + ', ' + index + ', ' + q.correctIndex + ')">' + 
                   '<span class="quiz-mcq-letter">' + String.fromCharCode(65 + index) + '</span>' + 
                   '<span class="quiz-mcq-text">' + safeOpt + '</span>' +
                   '</button>';
        }).join('');

        return '<div class="quiz-item mcq-item" data-id="' + q.id + '">' +
            '<div class="quiz-question">' +
            '<div class="quiz-q-num">' + q.id + '</div>' +
            '<div class="quiz-q-text">' + q.question + '</div>' +
            '</div>' +
            codeBlock +
            '<div class="quiz-mcq-options">' + optionsHtml + '</div>' +
            '<div class="quiz-mcq-feedback" id="quiz-feedback-' + q.id + '" style="display:none;">' +
            '<div class="quiz-answer-inner">' +
            '<div class="quiz-answer-icon" id="quiz-icon-' + q.id + '"></div>' +
            '<div class="quiz-answer-text">' +
            '<strong id="quiz-title-' + q.id + '"></strong>' +
            '<p style="margin-top:8px; line-height: 1.5;">' + q.explanation + '</p>' +
            '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">&#x1F4CE; ' + q.source + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');
    
    updateQuizScore(items);
}

export var quizState = { correct: 0, wrong: 0 };

export function markQuizMCQ(btn, qId, selectedIndex, correctIndex) {
    var item = btn.closest('.quiz-item');
    if (item.classList.contains('answered')) return; // Prevent multiple answers
    
    item.classList.add('answered');
    var isCorrect = (selectedIndex === correctIndex);
    
    // Disable all buttons in this question
    var buttons = item.querySelectorAll('.quiz-mcq-opt');
    buttons.forEach(function(b, idx) {
        b.disabled = true;
        if (idx === correctIndex) {
            b.classList.add('mcq-correct');
        } else if (idx === selectedIndex && !isCorrect) {
            b.classList.add('mcq-wrong');
        }
    });

    // Update global state
    if (isCorrect) {
        quizState.correct++;
    } else {
        quizState.wrong++;
    }
    
    // Show feedback
    var feedbackBox = document.getElementById('quiz-feedback-' + qId);
    var iconBox = document.getElementById('quiz-icon-' + qId);
    var titleBox = document.getElementById('quiz-title-' + qId);
    
    feedbackBox.style.display = 'block';
    if (isCorrect) {
        feedbackBox.classList.add('feedback-correct');
        iconBox.innerHTML = '&#x2705;'; // Check
        titleBox.innerHTML = 'Correct!';
        titleBox.style.color = 'var(--green)';
    } else {
        feedbackBox.classList.add('feedback-wrong');
        iconBox.innerHTML = '&#x274C;'; // Cross
        titleBox.innerHTML = 'Incorrect';
        titleBox.style.color = 'var(--red)';
    }
    
    updateQuizScore();
    if (window.updateDashboard) window.updateDashboard();
}

// Keep the old markQuiz around just in case, though it won't be used
export function markQuiz(btn, id, result) {
    // Deprecated for MCQ
}

export function toggleQuizAnswer(el) {
    // Deprecated for MCQ
}

function updateQuizScore() {
    var total = document.querySelectorAll('.quiz-item').length;
    document.getElementById('quiz-correct').innerHTML = quizState.correct + ' &#x2705;';
    document.getElementById('quiz-wrong').innerHTML = quizState.wrong + ' &#x274C;';
    document.getElementById('quiz-total').innerHTML = (quizState.correct + quizState.wrong) + '/' + total;
}

export function resetQuiz() {
    quizState = { correct: 0, wrong: 0 };
    document.querySelectorAll('.quiz-item').forEach(function (item) {
        item.classList.remove('answered');
        var buttons = item.querySelectorAll('.quiz-mcq-opt');
        buttons.forEach(function(b) {
            b.classList.remove('mcq-correct');
            b.classList.remove('mcq-wrong');
            b.disabled = false;
        });
        var feedbackBox = item.querySelector('.quiz-mcq-feedback');
        if (feedbackBox) {
            feedbackBox.style.display = 'none';
            feedbackBox.className = 'quiz-mcq-feedback';
        }
    });
    updateQuizScore();
}

// ─── CODING EXERCISES ──────────────────────────────────────────────

var difficultyOrder = { basic: 0, intermediate: 1, advanced: 2 };
var difficultyLabels = { basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' };
var difficultyIcons = { basic: '🟢', intermediate: '🟡', advanced: '🔴' };
var diffColors = { basic: 'var(--green)', intermediate: 'var(--amber)', advanced: 'var(--red)' };

export function renderExercises(exercises) {
    var list = document.getElementById('exercise-list');
    if (!exercises.length) {
        list.innerHTML = '<div class="loading"><p>No exercises generated.</p></div>';
        return;
    }

    // Load bookmarks
    var bookmarks = Storage.get('exercise_bookmarks', []);
    if (!Array.isArray(bookmarks)) bookmarks = [];

    function prismLang(lang) {
        var map = {
            gherkin: 'java', java: 'java', javascript: 'javascript', js: 'javascript',
            json: 'json', yaml: 'yaml', bash: 'bash', text: 'markdown'
        };
        return map[lang] || 'markdown';
    }

    // Sort exercises by difficulty order, then by ID
    var sorted = exercises.slice().sort(function (a, b) {
        var da = difficultyOrder[a.difficulty] !== undefined ? difficultyOrder[a.difficulty] : 1;
        var db = difficultyOrder[b.difficulty] !== undefined ? difficultyOrder[b.difficulty] : 1;
        if (da !== db) return da - db;
        return a.id - b.id;
    });

    // Load status tracking
    var statusData = Storage.get('exercise_status', {});

    // Compute per-difficulty stats for summary strip
    var diffStats = {};
    sorted.forEach(function (ex) {
        var d = ex.difficulty || 'intermediate';
        if (!diffStats[d]) diffStats[d] = { total: 0, solved: 0 };
        diffStats[d].total++;
        if (statusData[ex.id] === 'solved') diffStats[d].solved++;
    });
    var totalSolved = Object.values(diffStats).reduce(function (s, ds) { return s + ds.solved; }, 0);
    var totalAll = sorted.length;
    var overallPct = totalAll > 0 ? Math.round((totalSolved / totalAll) * 100) : 0;

    // Build the summary progress strip
    var summaryBars = Object.keys(diffStats).map(function (d) {
        var ds = diffStats[d];
        var pct = ds.total > 0 ? Math.round((ds.solved / ds.total) * 100) : 0;
        var color = diffColors[d] || 'var(--accent)';
        var icon = difficultyIcons[d] || '⚪';
        return '<div class="ex-summary-item" style="--diff-color: ' + color + '">' +
            '<span class="ex-summary-icon">' + icon + '</span>' +
            '<span class="ex-summary-label">' + (difficultyLabels[d] || d) + '</span>' +
            '<span class="ex-summary-count">' + ds.solved + '/' + ds.total + '</span>' +
            '<div class="ex-summary-bar"><div class="ex-summary-fill" style="width:' + pct + '%"></div></div>' +
            '</div>';
    }).join('');

    var html = '<div class="ex-summary-strip">' +
        '<div class="ex-summary-header">' +
        '<span class="ex-summary-title">&#x1F3C6; Progress</span>' +
        '<span class="ex-summary-overall">' + totalSolved + ' / ' + totalAll + ' solved</span>' +
        '</div>' +
        '<div class="ex-summary-bars">' + summaryBars + '</div>' +
        '<div class="ex-summary-progress">' +
        '<div class="ex-summary-progress-track">' +
        '<div class="ex-summary-progress-fill" style="width:' + overallPct + '%"></div>' +
        '</div>' +
        '<span class="ex-summary-percent">' + overallPct + '%</span>' +
        '</div>' +
        '</div>' +

        // B7: Quick-nav jump list
        '<div class="ex-quick-nav" id="exQuickNav">' +
        sorted.map(function (ex, qi) {
            var qs = statusData[ex.id] === 'solved' ? ' qn-solved' : '';
            return '<button class="ex-qn-btn' + qs + '" onclick="scrollToExercise(' + ex.id + ')" title="' + (difficultyLabels[ex.difficulty] || 'Exercise') + ' #' + (qi + 1) + ': ' + ex.title.replace(/"/g, '"') + '">' + (qi + 1) + '</button>';
        }).join('') +
        '</div>';

    // Group by difficulty for section headers
    var currentDiff = null;
    var globalIndex = 0;

    sorted.forEach(function (ex, i) {
        // Section header when difficulty changes
        if (ex.difficulty !== currentDiff) {
            currentDiff = ex.difficulty;
            var diffKey = currentDiff || 'intermediate';
            var label = difficultyLabels[diffKey] || 'Exercise';
            var icon = difficultyIcons[diffKey] || '⚪';
            var ds = diffStats[diffKey] || { total: 0, solved: 0 };
            html += '<div class="ex-section" data-diff="' + diffKey + '">' +
                '<div class="ex-section-header" onclick="toggleSection(this)" data-collapsed="false">' +
                '<span class="ex-section-icon">' + icon + '</span>' +
                '<span class="ex-section-title">' + label + '</span>' +
                '<span class="ex-section-progress">' + ds.solved + '/' + ds.total + '</span>' +
                '<div class="ex-section-bar"><div class="ex-section-bar-fill" style="width:' + (ds.total > 0 ? Math.round((ds.solved / ds.total) * 100) : 0) + '%;background:' + (diffColors[diffKey] || 'var(--accent)') + '"></div></div>' +
                '<span class="ex-section-toggle">&#x2212;</span>' +
                '</div>' +
                '<div class="ex-section-body">' +
                '</div>' +
                '</div>';
        }

        globalIndex++;
        var rawCode = ex.code;
        var lang = prismLang(ex.lang);
        var highlightedCode = rawCode;

        if (window.Prism && Prism.languages[lang]) {
            try {
                highlightedCode = Prism.highlight(rawCode, Prism.languages[lang], lang);
            } catch (e) {
                console.warn('Prism highlight failed for exercise:', ex.id, e);
                highlightedCode = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        } else {
            highlightedCode = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // Load saved code
        var savedCode = Storage.get('exercise_' + ex.id, null);
        var hasSavedCode = savedCode !== null;
        var initialCode = hasSavedCode ? savedCode : (ex.setup || '');

        // Status
        var status = statusData[ex.id] || (hasSavedCode ? 'in_progress' : 'not_started');
        var statusLabel = status === 'solved' ? 'Solved' : status === 'in_progress' ? 'In Progress' : 'Not Started';
        var statusClass = 'ex-status-' + status;

        // Difficulty class for card border
        var diffBorderClass = 'ex-card-' + (ex.difficulty || 'intermediate');

        // Hints
        var hints = ex.hints || [];
        var hintCount = hints.length;

        // Build line-numbered code from the (possibly highlighted) HTML
        var codeLines = highlightedCode.split('\n');
        console.log('[DEBUG] Exercise ID:', ex.id, 'Lines count:', codeLines.length);
        if (codeLines.length === 1) {
            console.log('[DEBUG] Single line content:', highlightedCode.substring(0, 100));
        }
        var numberedCode = codeLines.map(function (line, lineIdx) {
            return '<div class="ex-line">' +
                   '<span class="ex-line-num" data-n="' + (lineIdx + 1) + '"></span>' +
                   '<span class="ex-line-code">' + (line || ' ') + '</span>' +
                   '</div>';
        }).join('');

        html += '<div class="exercise-card ' + diffBorderClass + '" data-ex="' + ex.id + '" data-diff="' + (ex.difficulty || 'intermediate') + '" style="--card-index: ' + (globalIndex - 1) + '">' +
            '<div class="exercise-card-header">' +
            '<div>' +
            '<div class="ex-num">' +
            '<span class="ex-diff-badge ' + ('ex-diff-' + (ex.difficulty || 'intermediate')) + '" title="' + (ex.difficulty === 'basic' ? 'Foundational level — no prior experience needed' : ex.difficulty === 'advanced' ? 'Challenging level — multi-step concepts and edge cases' : 'Standard level — common real-world patterns') + '">' + (ex.difficulty === 'basic' ? '🟢' : ex.difficulty === 'advanced' ? '🔴' : '🟡') + ' ' + (difficultyLabels[ex.difficulty] || 'Intermediate') + '</span>' +
            ' Exercise #' + (globalIndex) +
            '</div>' +
            '<div class="ex-title">' + ex.title + '</div>' +
            '</div>' +
            '<div class="ex-header-right">' +
            '<span class="ex-status ' + statusClass + '">' +
            (status === 'solved' ? '&#x2705;' : status === 'in_progress' ? '&#x1F4DD;' : '&#x25CB;') + ' ' + statusLabel +
            '</span>' +
            '<span class="ex-lang">' + ex.lang + '</span>' +
            '<button class="ex-btn-bookmark' + (bookmarks.indexOf(ex.id) !== -1 ? ' bookmarked' : '') + '" onclick="toggleBookmark(this)" data-ex="' + ex.id + '" title="' + (bookmarks.indexOf(ex.id) !== -1 ? 'Remove bookmark' : 'Bookmark for review') + '">' + (bookmarks.indexOf(ex.id) !== -1 ? '&#x2B50;' : '&#x2606;') + '</button>' +
            '</div>' +
            '</div>' +
            '<div class="exercise-body">' +
            '<p class="ex-desc">' + ex.description + '</p>' +

            // Action buttons
            '<div class="exercise-actions">' +
            '<button class="ex-btn ex-btn-primary" onclick="revealSolution(this)">&#x1F50D; Reveal Solution</button>' +
            '<button class="ex-btn ex-btn-secondary" onclick="toggleEditor(this)">&#x270F;&#xFE0F; Practice Area</button>' +
            (hintCount > 0 ? '<button class="ex-btn ex-btn-hint" onclick="cycleHint(this)" data-hint-idx="-1" data-hint-count="' + hintCount + '">&#x1F4A1; Show Hint</button>' : '') +
            '<button class="ex-btn ex-btn-solved" onclick="markExerciseSolved(this)">&#x2705; Mark Solved</button>' +
            '<button class="ex-btn ex-btn-unsolved" onclick="markExerciseUnsolved(this)" style="display:' + (status === 'solved' ? 'inline-flex' : 'none') + '">&#x21BA; Mark Unsolved</button>' +
            '</div>' +

            // Hint area (hidden until clicked)
            (hintCount > 0 ? '<div class="ex-hint-area" style="display:none">' +
                '<div class="ex-hint-label">&#x1F4A1; Hint</div>' +
                '<div class="ex-hint-text"></div>' +
                '</div>' : '') +

            // Solution block
            '<div class="ex-solution">' +
            '<div class="ex-solution-header">' +
            '<span class="ex-solution-label">&#x2705; Solution</span>' +
            '<button class="ex-btn ex-btn-copy" onclick="copySolution(this)">&#x1F4CB; Copy</button>' +
            '</div>' +
            '<pre class="ex-code-block"><code>' + numberedCode + '</code></pre>' +
            '</div>' +

            // Practice editor
            '<div class="ex-editor" style="display:none">' +
            '<div class="ex-editor-toolbar">' +
            '<span class="ex-editor-label">&#x270F;&#xFE0F; Practice Area</span>' +
            '<div class="ex-editor-actions">' +
            '<button class="ex-btn ex-btn-sm ex-btn-primary" onclick="validateExercise(this)" style="background:var(--accent);color:white;border:none;">&#x25B6;&#xFE0F; Run Validation</button>' +
            '<button class="ex-btn ex-btn-sm ex-btn-secondary" onclick="resetExerciseCode(this)">&#x21BA; Reset</button>' +
            '<button class="ex-btn ex-btn-sm ex-btn-secondary" onclick="togglePreview(this)">&#x1F441; Preview</button>' +
            '</div>' +
            '</div>' +
            '<div class="monaco-container" id="monaco-container-' + ex.id + '" data-lang="' + lang + '" style="position: relative; height: 300px; width: 100%; margin-top: 10px; border: 1px solid var(--border-color); border-radius: 4px; overflow:hidden;"></div>' +
            '<textarea class="hidden-textarea" id="hidden-textarea-' + ex.id + '" style="display:none;">' + initialCode.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
            '<div class="ex-preview" style="display:none"><pre class="ex-code-block"><code class="language-' + lang + '"></code></pre></div>' +
            '<div class="ex-validation-feedback" style="display:none; margin-top: 10px; padding: 10px; border-radius: 4px; font-size: 0.9rem;"></div>' +
            '<div class="ex-editor-footer">' +
            '<span class="save-status"></span>' +
            '</div>' +
            '</div>' +

            '</div>' +
            '</div>';
    });

    list.innerHTML = html;

    // Move cards into their section bodies
    document.querySelectorAll('.ex-section').forEach(function (section) {
        var diff = section.getAttribute('data-diff');
        var body = section.querySelector('.ex-section-body');
        var cards = document.querySelectorAll('.exercise-card[data-diff="' + diff + '"]');
        cards.forEach(function (card) {
            body.appendChild(card);
        });
    });

    // Initialize Monaco Editors
    window.monacoEditors = window.monacoEditors || {};
    if (window.monacoLoaded) {
        window.monacoLoaded.then(function(monaco) {
            document.querySelectorAll('.monaco-container').forEach(function(container) {
                var exId = container.id.replace('monaco-container-', '');
                var hiddenTa = document.getElementById('hidden-textarea-' + exId);
                var lang = container.getAttribute('data-lang');
                
                // Map custom langs to monaco langs
                var monacoLang = lang;
                if (lang === 'java' || lang === 'gherkin') monacoLang = 'java'; // We'll use java syntax for gherkin for now
                if (lang === 'bash') monacoLang = 'shell';

                var editor = monaco.editor.create(container, {
                    value: hiddenTa.value.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                    language: monacoLang,
                    theme: Storage.get('theme', 'dark') === 'dark' ? 'vs-dark' : 'vs',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    automaticLayout: true
                });

                window.monacoEditors[exId] = editor;

                var card = container.closest('.exercise-card');
                var footer = card.querySelector('.ex-editor-footer .save-status');
                
                var timeout = null;
                editor.onDidChangeModelContent(function() {
                    if (footer) footer.textContent = 'Saving...';
                    var val = editor.getValue();
                    // Sync with hidden textarea for preview mode
                    hiddenTa.value = val;
                    
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        Storage.set('exercise_' + exId, val);
                        var statusData = Storage.get('exercise_status', {});
                        if (statusData[exId] !== 'solved') {
                            statusData[exId] = 'in_progress';
                            Storage.set('exercise_status', statusData);
                            var statusEl = card.querySelector('.ex-status');
                            if (statusEl) {
                                statusEl.className = 'ex-status ex-status-in_progress';
                                statusEl.innerHTML = '&#x1F4DD; In Progress';
                            }
                            var solvedBtn = card.querySelector('.ex-btn-solved');
                            var unsolvedBtn = card.querySelector('.ex-btn-unsolved');
                            if (solvedBtn) solvedBtn.style.display = 'inline-flex';
                            if (unsolvedBtn) unsolvedBtn.style.display = 'none';
                        }
                        if (footer) footer.innerHTML = 'Saved &#x2705;';
                        if (window.updateDashboard) window.updateDashboard();
                        setTimeout(function () { if (footer) footer.textContent = ''; }, 2000);
                    }, 500);
                });
            });
        });
    }
}

export function revealSolution(btn) {
    var card = btn.closest('.exercise-card');
    var sol = card.querySelector('.ex-solution');
    var isOpening = !sol.classList.contains('open');

    // Accordion: close other open solutions when opening a new one
    if (isOpening) {
        document.querySelectorAll('.ex-solution.open').forEach(function (openSol) {
            var openCard = openSol.closest('.exercise-card');
            if (openCard) {
                openSol.classList.remove('open');
                var otherBtn = openCard.querySelector('.ex-btn-primary');
                if (otherBtn) {
                    otherBtn.innerHTML = '&#x1F50D; Reveal Solution';
                    otherBtn.classList.remove('revealed');
                }
            }
        });
    }

    sol.classList.toggle('open');
    btn.classList.toggle('revealed', isOpening);
    btn.innerHTML = isOpening ? '&#x1F512; Hide Solution' : '&#x1F50D; Reveal Solution';

    if (isOpening) {
        // Prism highlighting is already handled during initial render
        // to preserve the custom line-numbered DOM structure.
        // Auto-scroll to the solution so it's fully visible
        setTimeout(function () {
            sol.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }
}

export function toggleEditor(btn) {
    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var editor = card.querySelector('.ex-editor');
    var isHidden = editor.style.display === 'none' || !editor.style.display;
    editor.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden ? '&#x1F4C1; Hide Practice Area' : '&#x270F;&#xFE0F; Practice Area';
    if (isHidden) {
        if (window.monacoEditors && window.monacoEditors[exId]) {
            // Need to call layout when a hidden monaco editor becomes visible
            setTimeout(function() {
                window.monacoEditors[exId].layout();
                window.monacoEditors[exId].focus();
            }, 50);
        } else {
            var ta = editor.querySelector('textarea.hidden-textarea');
            if (ta) setTimeout(function () { ta.focus(); }, 100);
        }
    }
}

// ─── MARK SOLVED / UNSOLVED ──────────────────────────────────────

export function markExerciseSolved(btn) {
    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var statusData = Storage.get('exercise_status', {});

    statusData[exId] = 'solved';
    Storage.set('exercise_status', statusData);

    // Update UI
    var statusEl = card.querySelector('.ex-status');
    if (statusEl) {
        statusEl.className = 'ex-status ex-status-solved';
        statusEl.innerHTML = '&#x2705; Solved';
    }
    btn.style.display = 'none';
    var unsolvedBtn = card.querySelector('.ex-btn-unsolved');
    if (unsolvedBtn) unsolvedBtn.style.display = 'inline-flex';

    if (window.updateDashboard) window.updateDashboard();
}

export function markExerciseUnsolved(btn) {
    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var statusData = Storage.get('exercise_status', {});

    // Check if they have code saved → in_progress, else not_started
    var hasCode = Storage.get('exercise_' + exId, null) !== null;
    statusData[exId] = hasCode ? 'in_progress' : 'not_started';
    Storage.set('exercise_status', statusData);

    // Update UI
    var statusEl = card.querySelector('.ex-status');
    if (statusEl) {
        var newLabel = hasCode ? 'In Progress' : 'Not Started';
        var newIcon = hasCode ? '&#x1F4DD;' : '&#x25CB;';
        statusEl.className = 'ex-status ex-status-' + (hasCode ? 'in_progress' : 'not_started');
        statusEl.innerHTML = newIcon + ' ' + newLabel;
    }
    btn.style.display = 'none';
    var solvedBtn = card.querySelector('.ex-btn-solved');
    if (solvedBtn) solvedBtn.style.display = 'inline-flex';

    if (window.updateDashboard) window.updateDashboard();
}

// ─── RESET CODE ──────────────────────────────────────────────────

export function resetExerciseCode(btn) {
    if (!confirm('Reset your practice code? This will clear your edits.')) return;

    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var hiddenTa = document.getElementById('hidden-textarea-' + exId);

    // Find the original exercise to get setup code
    if (window.AppData && window.AppData.exercises) {
        var ex = window.AppData.exercises.find(function (e) { return e.id == exId; });
        if (ex) {
            var setupCode = ex.setup || '';
            
            // Update Monaco Editor if available
            if (window.monacoEditors && window.monacoEditors[exId]) {
                window.monacoEditors[exId].setValue(setupCode);
            }
            if (hiddenTa) hiddenTa.value = setupCode;
            
            Storage.set('exercise_' + exId, setupCode);
            var footer = card.querySelector('.ex-editor-footer .save-status');
            var feedback = card.querySelector('.ex-validation-feedback');
            if (feedback) feedback.style.display = 'none';
            if (footer) footer.innerHTML = 'Reset &#x2705;';
            setTimeout(function () { if (footer) footer.textContent = ''; }, 2000);
        }
    }
}

// ─── COPY SOLUTION ───────────────────────────────────────────────

export function copySolution(btn) {
    var card = btn.closest('.exercise-card');
    var codeBlock = card.querySelector('.ex-solution pre code');
    var text = codeBlock.textContent || codeBlock.innerText;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            var orig = btn.innerHTML;
            btn.innerHTML = '&#x2705; Copied!';
            btn.classList.add('ex-btn-copied');
            setTimeout(function () {
                btn.innerHTML = orig;
                btn.classList.remove('ex-btn-copied');
            }, 2000);
        }).catch(function () {
            fallbackCopy(text, btn);
        });
    } else {
        fallbackCopy(text, btn);
    }
}

function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        var orig = btn.innerHTML;
        btn.innerHTML = '&#x2705; Copied!';
        btn.classList.add('ex-btn-copied');
        setTimeout(function () {
            btn.innerHTML = orig;
            btn.classList.remove('ex-btn-copied');
        }, 2000);
    } catch (e) { }
    document.body.removeChild(ta);
}

// ─── HINT SYSTEM ─────────────────────────────────────────────────

export function cycleHint(btn) {
    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var hintArea = card.querySelector('.ex-hint-area');
    var hintText = card.querySelector('.ex-hint-text');

    // Get current hint index
    var idx = parseInt(btn.getAttribute('data-hint-idx'), 10);
    var count = parseInt(btn.getAttribute('data-hint-count'), 10);

    // Find the exercise
    if (window.AppData && window.AppData.exercises) {
        var ex = window.AppData.exercises.find(function (e) { return e.id == exId; });
        if (ex && ex.hints && ex.hints.length > 0) {
            var nextIdx = idx + 1;
            if (nextIdx < ex.hints.length) {
                // Show this hint
                hintArea.style.display = 'block';
                hintText.textContent = ex.hints[nextIdx];
                btn.setAttribute('data-hint-idx', nextIdx);

                if (nextIdx === ex.hints.length - 1) {
                    btn.innerHTML = '&#x1F4A1; No more hints';
                    btn.disabled = true;
                } else {
                    btn.innerHTML = '&#x1F4A1; Hint ' + (nextIdx + 1) + '/' + ex.hints.length;
                }
            }
        }
    }
}

// ─── SYNTAX PREVIEW TOGGLE ──────────────────────────────────────

export function togglePreview(btn) {
    var card = btn.closest('.exercise-card');
    var editor = card.querySelector('.ex-editor');
    var monacoContainer = editor.querySelector('.monaco-container');
    var hiddenTa = document.getElementById('hidden-textarea-' + card.getAttribute('data-ex'));
    var previewArea = editor.querySelector('.ex-preview');
    var isHidden = previewArea.style.display === 'none' || !previewArea.style.display;

    if (isHidden) {
        // Render preview
        var code = window.monacoEditors && window.monacoEditors[card.getAttribute('data-ex')] 
            ? window.monacoEditors[card.getAttribute('data-ex')].getValue() 
            : hiddenTa.value;
            
        var codeBlock = previewArea.querySelector('pre code');
        var safeCode = code
            .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
            .replace(/"/g, '"');
        // Add line numbers
        var lines = safeCode.split('\n');
        var numbered = lines.map(function (line, lineIdx) {
            return '<span class="ex-line"><span class="ex-line-num" data-n="' + (lineIdx + 1) + '"></span><span class="ex-line-code">' + line + '</span></span>';
        }).join('');
        codeBlock.innerHTML = numbered;

        previewArea.style.display = 'block';
        monacoContainer.style.display = 'none';
        btn.innerHTML = '&#x270F;&#xFE0F; Edit';

        if (window.Prism) Prism.highlightElement(codeBlock);

    } else {
        // Switch back to editor
        previewArea.style.display = 'none';
        monacoContainer.style.display = 'block';
        btn.innerHTML = '&#x1F441; Preview';
    }
}

// ─── LIVE VALIDATION SIMULATION ──────────────────────────────────

export function validateExercise(btn) {
    var card = btn.closest('.exercise-card');
    var exId = card.getAttribute('data-ex');
    var feedbackEl = card.querySelector('.ex-validation-feedback');
    
    var code = window.monacoEditors && window.monacoEditors[exId] 
        ? window.monacoEditors[exId].getValue() 
        : document.getElementById('hidden-textarea-' + exId).value;
    
    // Find the original exercise to get expected solution snippet
    if (window.AppData && window.AppData.exercises) {
        var ex = window.AppData.exercises.find(function (e) { return e.id == exId; });
        if (ex) {
            // This is a basic simulated validation.
            // We check if their code contains key parts of the expected solution.
            var solutionCode = ex.code || '';
            // Very naive check: just see if some keywords match based on the type of exercise
            
            var errors = [];
            var codeLower = code.toLowerCase();
            
            // Basic Gherkin checks
            if (ex.lang === 'gherkin') {
                if (solutionCode.includes('Given ') && !code.includes('Given ')) errors.push("Missing 'Given' step.");
                if (solutionCode.includes('When method ') && !code.includes('When method ')) errors.push("Missing 'When method' step.");
                if (solutionCode.includes('Then status ') && !code.includes('Then status ')) errors.push("Missing 'Then status' assertion.");
                if (solutionCode.includes('match ') && !code.includes('match ')) errors.push("Missing 'match' assertion.");
            } else if (ex.lang === 'javascript' || ex.lang === 'js') {
                if (solutionCode.includes('function') && !code.includes('function') && !code.includes('=>')) errors.push("Missing function definition.");
            } else if (ex.lang === 'json') {
                try {
                    JSON.parse(code);
                } catch(e) {
                    errors.push("Invalid JSON syntax: " + e.message);
                }
            }
            
            // Check for exact lines if it's very strict, but usually we just do a heuristic
            // If the solution has `status 200`, make sure they have it
            if (solutionCode.includes('status 200') && !code.includes('status 200')) errors.push("Expected a 200 status check.");
            if (solutionCode.includes('status 404') && !code.includes('status 404')) errors.push("Expected a 404 status check.");
            
            feedbackEl.style.display = 'block';
            if (errors.length > 0) {
                feedbackEl.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                feedbackEl.style.border = '1px solid var(--red)';
                feedbackEl.style.color = 'var(--red)';
                feedbackEl.innerHTML = '<strong>Validation Failed:</strong><ul>' + errors.map(e => '<li>' + e + '</li>').join('') + '</ul>';
            } else if (code.trim().length < 10) {
                feedbackEl.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                feedbackEl.style.border = '1px solid var(--amber)';
                feedbackEl.style.color = 'var(--amber)';
                feedbackEl.innerHTML = '<strong>Code too short:</strong> Please write a complete solution.';
            } else {
                feedbackEl.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                feedbackEl.style.border = '1px solid var(--green)';
                feedbackEl.style.color = 'var(--green)';
                feedbackEl.innerHTML = '<strong>Validation Passed!</strong> Your logic looks solid. &#x1F389;';
                
                // Auto mark solved
                var solvedBtn = card.querySelector('.ex-btn-solved');
                if (solvedBtn) markExerciseSolved(solvedBtn);
            }
        }
    }
}

// ─── TOGGLE SECTION (COLLAPSE/EXPAND) ──────────────────────────

export function toggleSection(header) {
    var section = header.closest('.ex-section');
    var body = section.querySelector('.ex-section-body');
    var toggle = section.querySelector('.ex-section-toggle');
    var isCollapsed = header.getAttribute('data-collapsed') === 'true';
    header.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
    body.style.display = isCollapsed ? '' : 'none';
    toggle.innerHTML = isCollapsed ? '&#x2212;' : '&#x2B;';
}

// ─── BOOKMARK TOGGLE (B8) ─────────────────────────────────────────

export function toggleBookmark(btn) {
    var exId = parseInt(btn.getAttribute('data-ex'), 10);
    var bookmarks = Storage.get('exercise_bookmarks', []);
    if (!Array.isArray(bookmarks)) bookmarks = [];

    var idx = bookmarks.indexOf(exId);
    if (idx !== -1) {
        bookmarks.splice(idx, 1);
        btn.innerHTML = '&#x2606;';
        btn.classList.remove('bookmarked');
        btn.setAttribute('title', 'Bookmark for review');
    } else {
        bookmarks.push(exId);
        btn.innerHTML = '&#x2B50;';
        btn.classList.add('bookmarked');
        btn.setAttribute('title', 'Remove bookmark');
    }
    Storage.set('exercise_bookmarks', bookmarks);
    if (window.updateDashboard) window.updateDashboard();
}

// ─── QUICK-NAV SCROLL (B7) ─────────────────────────────────────

export function scrollToExercise(exId) {
    var card = document.querySelector('.exercise-card[data-ex="' + exId + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update active state in quick-nav
    document.querySelectorAll('.ex-qn-btn').forEach(function (b) { b.classList.remove('qn-active'); });
    var qnBtn = document.querySelector('.ex-qn-btn:nth-child(' + (Array.from(document.querySelectorAll('.exercise-card')).indexOf(card) + 1) + ')');
    if (qnBtn) qnBtn.classList.add('qn-active');
}
