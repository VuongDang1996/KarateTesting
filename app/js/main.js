import { Storage } from './storage.js';
import { initTheme, toggleTheme } from './theme.js';
import { extractFlashcards, extractQuiz, extractExercises } from './parser.js';
import { renderFlashcards, renderQuiz, renderExercises, toggleQuizAnswer, markQuiz, markFlashcard, revealSolution, toggleEditor, markExerciseSolved, markExerciseUnsolved, resetExerciseCode, copySolution, cycleHint, togglePreview, toggleSection, toggleBookmark, scrollToExercise } from './renderers.js';
import { generateToC } from './toc.js';

export var AppData = { flashcards: [], quizItems: [], exercises: [] };

export function switchDoc(docId) {
    document.querySelectorAll('.tab-btn').forEach(function (b) {
        var a = b.getAttribute('data-doc') === docId;
        b.classList.toggle('active', a);
        b.setAttribute('aria-selected', a);
    });
    document.querySelectorAll('.doc-content').forEach(function (p) {
        p.classList.toggle('active', p.id === 'doc-' + docId);
    });
    if (typeof Storage !== 'undefined') Storage.set('activeDoc', docId);
}

export function switchMode(modeId) {
    document.querySelectorAll('.mode-btn').forEach(function (b) {
        var a = b.getAttribute('data-mode') === modeId;
        b.classList.toggle('active', a);
        b.setAttribute('aria-selected', a);
    });
    document.querySelectorAll('.mode-content').forEach(function (p) {
        p.style.display = p.id === 'mode-' + modeId ? '' : 'none';
        if (p.id === 'mode-' + modeId) p.classList.add('active');
        else p.classList.remove('active');
    });
    Storage.set('activeMode', modeId);
    renderFilterChips(modeId);
    document.getElementById('globalSearch').value = '';
    handleSearch();
}

// B5: Global Escape key — close solution/hint panels
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var activeMode = document.querySelector('.mode-btn.active');
    if (!activeMode) return;
    if (activeMode.getAttribute('data-mode') !== 'coding') return;
    document.querySelectorAll('.ex-solution.open').forEach(function (sol) {
        sol.classList.remove('open');
        var btn = sol.closest('.exercise-card').querySelector('.ex-btn-primary');
        if (btn) {
            btn.innerHTML = '&#x1F50D; Reveal Solution';
            btn.classList.remove('revealed');
        }
    });
    document.querySelectorAll('.ex-hint-area[style*="display: block"]').forEach(function (hint) {
        hint.style.display = 'none';
        var btn = hint.closest('.exercise-card').querySelector('.ex-btn-hint');
        if (btn) {
            btn.disabled = false;
            btn.setAttribute('data-hint-idx', '-1');
            btn.innerHTML = '&#x1F4A1; Show Hint';
        }
    });
});

export function setStatus(state, text) {
    var dot = document.getElementById('statusDot');
    var txt = document.getElementById('statusText');
    dot.className = 'dot';
    if (state) dot.classList.add(state);
    txt.innerHTML = text;
}

export function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function updateBadge(tabId, count) {
    var el = document.getElementById('badge-' + tabId);
    if (!el) return;
    el.innerHTML = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count + 'w';
}

var activeFilter = 'All';

export function handleSearch() {
    var query = document.getElementById('globalSearch').value.toLowerCase();
    var activeMode = document.querySelector('.mode-btn.active').getAttribute('data-mode');

    if (activeMode === 'flashcards') {
        document.querySelectorAll('.flashcard').forEach(function (card) {
            var text = card.textContent.toLowerCase();
            var cat = card.querySelector('.flashcard-category').textContent.trim();
            var matchesQuery = text.includes(query);
            var matchesFilter = activeFilter === 'All' || cat === activeFilter.toLowerCase() || (activeFilter === 'Concept' && cat === 'concept');
            card.style.display = matchesQuery && matchesFilter ? '' : 'none';
        });
    } else if (activeMode === 'quiz') {
        document.querySelectorAll('.quiz-item').forEach(function (item) {
            var text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    } else if (activeMode === 'coding') {
        var diffMap = { basic: 'basic', intermediate: 'intermediate', advanced: 'advanced' };
        // B8: Load bookmarks for filter
        var bookmarksFilter = Storage.get('exercise_bookmarks', []);
        if (!Array.isArray(bookmarksFilter)) bookmarksFilter = [];
        var visibleCount = 0;
        document.querySelectorAll('.exercise-card').forEach(function (card) {
            var text = card.textContent.toLowerCase();
            var lang = card.querySelector('.ex-lang').textContent.trim();
            var diff = (card.getAttribute('data-diff') || '').toLowerCase();
            var filterLower = activeFilter.toLowerCase();
            var exId = parseInt(card.getAttribute('data-ex'), 10);
            var isBookmarked = bookmarksFilter.indexOf(exId) !== -1;
            var matchesQuery = text.includes(query);
            var matchesFilter = activeFilter === 'All' ||
                (activeFilter === 'Bookmarked' && isBookmarked) ||
                lang === filterLower ||
                diff === filterLower ||
                diffMap[filterLower] === diff;
            var isVisible = matchesQuery && matchesFilter;
            card.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;

            // B2: Search highlighting in titles and descriptions
            var titleEl = card.querySelector('.ex-title');
            var descEl = card.querySelector('.ex-desc');
            if (titleEl) {
                var origTitle = titleEl.getAttribute('data-orig') || titleEl.textContent;
                if (!titleEl.getAttribute('data-orig')) titleEl.setAttribute('data-orig', origTitle);
                if (query && isVisible) {
                    var titleText = titleEl.getAttribute('data-orig');
                    var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
                    titleEl.innerHTML = titleText.replace(regex, '<mark class="ex-search-highlight">$1</mark>');
                } else {
                    titleEl.innerHTML = titleEl.getAttribute('data-orig');
                }
            }
            if (descEl) {
                var origDesc = descEl.getAttribute('data-orig') || descEl.textContent;
                if (!descEl.getAttribute('data-orig')) descEl.setAttribute('data-orig', origDesc);
                if (query && isVisible) {
                    var descText = descEl.getAttribute('data-orig');
                    var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
                    descEl.innerHTML = descText.replace(regex, '<mark class="ex-search-highlight">$1</mark>');
                } else {
                    descEl.innerHTML = descEl.getAttribute('data-orig');
                }
            }
        });

        // B1: Empty state message
        var listEl = document.getElementById('exercise-list');
        var emptyEl = document.getElementById('ex-empty-state');
        if (visibleCount === 0) {
            if (!emptyEl) {
                emptyEl = document.createElement('div');
                emptyEl.id = 'ex-empty-state';
                emptyEl.className = 'ex-empty-state';
                emptyEl.innerHTML = '<div class="ex-empty-icon">&#x1F50D;</div><div class="ex-empty-title">No exercises match your filter</div><div class="ex-empty-desc">Try a different search term or clear the filter to see all exercises.</div>';
                listEl.appendChild(emptyEl);
            }
            emptyEl.style.display = '';
        } else if (emptyEl) {
            emptyEl.style.display = 'none';
        }
    }
}

export function setFilter(filterBtn, filterVal) {
    document.querySelectorAll('.filter-chip').forEach(function (b) { b.classList.remove('active'); });
    filterBtn.classList.add('active');
    activeFilter = filterVal;
    handleSearch();
}

export function renderFilterChips(modeId) {
    var chipsContainer = document.getElementById('filterChips');
    var chips = ['All'];

    // Compute counts for coding mode filters
    var exCounts = {};
    if (modeId === 'coding' && window.AppData && window.AppData.exercises) {
        var exs = window.AppData.exercises;
        exCounts['All'] = exs.length;
        exs.forEach(function (ex) {
            var lang = (ex.lang || '').toLowerCase();
            var diff = (ex.difficulty || 'intermediate');
            var diffCap = diff.charAt(0).toUpperCase() + diff.slice(1);
            exCounts[lang] = (exCounts[lang] || 0) + 1;
            exCounts[diffCap] = (exCounts[diffCap] || 0) + 1;
        });
        // B8: Count bookmarked exercises
        var bookmarks = Storage.get('exercise_bookmarks', []);
        if (!Array.isArray(bookmarks)) bookmarks = [];
        exCounts['Bookmarked'] = bookmarks.length;
    }

    if (modeId === 'flashcards') {
        chips = ['All', 'Concept', 'Gotcha', 'API', 'Config'];
    } else if (modeId === 'coding') {
        chips = ['All', 'gherkin', 'java', 'javascript', 'yaml', 'Basic', 'Intermediate', 'Advanced', 'Bookmarked'];
    }

    if (chips.length > 1) {
        chipsContainer.innerHTML = chips.map(function (c) {
            var activeClass = c === 'All' ? 'active' : '';
            var count = exCounts[c] || '';
            var countHtml = count ? ' <span class="chip-count">' + count + '</span>' : '';
            return '<button class="filter-chip ' + activeClass + '" onclick="setFilter(this, \'' + c + '\')">' + c + countHtml + '</button>';
        }).join('');
        chipsContainer.style.display = '';
    } else {
        chipsContainer.style.display = 'none';
    }
    activeFilter = 'All';
    handleSearch();
}

function loadMarkdown(filePath, tabId) {
    var loadingEl = document.getElementById('loading-' + tabId);
    var contentEl = document.getElementById('content-' + tabId);
    var errorEl = document.getElementById('error-' + tabId);
    var errorDetail = document.getElementById('error-' + tabId + '-detail');

    return fetch(filePath)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' ' + response.statusText);
            }
            return response.text();
        })
        .then(function (rawMarkdown) {
            marked.setOptions({ breaks: true, gfm: true });
            var html = marked.parse(rawMarkdown);
            contentEl.innerHTML = html;

            updateBadge(tabId, wordCount(rawMarkdown));

            loadingEl.style.display = 'none';
            errorEl.style.display = 'none';
            contentEl.style.display = '';

            // Generate ToC
            generateToC('content-' + tabId);

            return rawMarkdown;
        })
        .catch(function (err) {
            loadingEl.style.display = 'none';
            contentEl.style.display = 'none';
            errorDetail.innerHTML = err.message || String(err);
            errorEl.style.display = '';
            var badge = document.getElementById('badge-' + tabId);
            if (badge) badge.innerHTML = '&#x26A0;&#xFE0F;';
            throw err;
        });
}

document.addEventListener('DOMContentLoaded', function () {
    setStatus('', 'Loading...');
    initTheme();

    var tabBar = document.querySelector('.tab-bar-inner');
    var learnBtn = document.createElement('button');
    learnBtn.className = 'tab-btn';
    learnBtn.setAttribute('role', 'tab');
    learnBtn.setAttribute('aria-selected', 'false');
    learnBtn.setAttribute('data-doc', 'learn');
    learnBtn.onclick = function () { switchDoc('learn'); };
    learnBtn.innerHTML = '<span class="tab-icon">&#x1F393;</span> Interactive Learning <span class="tab-badge">new</span>';
    tabBar.appendChild(learnBtn);

    var savedDoc = Storage.get('activeDoc', 'readme');
    switchDoc(savedDoc);

    var savedMode = Storage.get('activeMode', 'flashcards');
    switchMode(savedMode);

    Promise.all([
        loadMarkdown('../Learning/README.md', 'readme'),
        loadMarkdown('../Learning/business_overview.md', 'overview')
    ]).then(function (results) {
        var readmeText = results[0];
        var overviewText = results[1];

        setStatus('loaded', 'Ready &#x2705;');

        AppData.flashcards = extractFlashcards(readmeText, overviewText);
        AppData.quizItems = extractQuiz(readmeText, overviewText);
        AppData.exercises = extractExercises(readmeText, overviewText);

        renderFlashcards(AppData.flashcards);
        renderQuiz(AppData.quizItems);
        renderExercises(AppData.exercises);

        renderFilterChips(savedMode);
        updateDashboard();

    }).catch(function (err) {
        setStatus('error', 'Error loading files');
        console.error('Failed to load markdown files:', err);
    });
});

export function updateDashboard() {
    // Flashcard Mastery
    var srData = Storage.get('flashcard_sr', {});
    var totalCards = AppData.flashcards.length;
    var masteredCount = 0;
    if (totalCards > 0) {
        masteredCount = Object.values(srData).filter(function (v) { return v >= 2; }).length;
        var fcPct = Math.round((masteredCount / totalCards) * 100);
        document.getElementById('stat-flashcards').textContent = fcPct + '%';
        document.getElementById('bar-flashcards').style.width = fcPct + '%';
    }

    // Quiz Score
    var totalQuiz = AppData.quizItems.length;
    var correctScore = 0;
    if (totalQuiz > 0) {
        var correctItems = document.querySelectorAll('.quiz-item .marked-correct').length;
        var quizPct = Math.round((correctItems / totalQuiz) * 100);
        document.getElementById('stat-quiz').textContent = quizPct + '%';
        document.getElementById('bar-quiz').style.width = quizPct + '%';
    }

    // Exercises — show solved count + difficulty breakdown
    var totalEx = AppData.exercises.length;
    var statusData = Storage.get('exercise_status', {});
    if (totalEx > 0) {
        var solvedCount = 0;
        var inProgressCount = 0;
        var diffCounts = { basic: 0, intermediate: 0, advanced: 0 };
        var solvedDiffCounts = { basic: 0, intermediate: 0, advanced: 0 };

        AppData.exercises.forEach(function (ex) {
            var s = statusData[ex.id] || 'not_started';
            if (s === 'solved') {
                solvedCount++;
                var d = ex.difficulty || 'intermediate';
                if (solvedDiffCounts[d] !== undefined) solvedDiffCounts[d]++;
            } else if (s === 'in_progress') {
                inProgressCount++;
            }
            var diff = ex.difficulty || 'intermediate';
            if (diffCounts[diff] !== undefined) diffCounts[diff]++;
        });

        var exPct = Math.round((solvedCount / totalEx) * 100);
        document.getElementById('stat-exercises').textContent = solvedCount + ' / ' + totalEx;
        document.getElementById('bar-exercises').style.width = exPct + '%';

        // Update difficulty breakdown if elements exist
        var diffStats = document.getElementById('stat-ex-diff');
        if (diffStats) {
            var basicTotal = diffCounts.basic || 0;
            var interTotal = diffCounts.intermediate || 0;
            var advTotal = diffCounts.advanced || 0;
            // B8: Bookmarked count
            var bookmarks = Storage.get('exercise_bookmarks', []);
            if (!Array.isArray(bookmarks)) bookmarks = [];
            diffStats.innerHTML =
                '<span class="ex-diff-badge ex-diff-basic">🟢 ' + solvedDiffCounts.basic + '/' + basicTotal + ' Basic</span> ' +
                '<span class="ex-diff-badge ex-diff-intermediate">🟡 ' + solvedDiffCounts.intermediate + '/' + interTotal + ' Intermediate</span> ' +
                '<span class="ex-diff-badge ex-diff-advanced">🔴 ' + solvedDiffCounts.advanced + '/' + advTotal + ' Advanced</span>' +
                '<br><span style="font-size:0.75rem;opacity:0.7">⭐ ' + bookmarks.length + ' bookmarked</span>';
        }
    }
}

export function exportProgress() {
    var data = {
        theme: Storage.get('theme', 'dark'),
        flashcard_sr: Storage.get('flashcard_sr', {}),
        exercise_status: Storage.get('exercise_status', {}),
        exercises: {}
    };

    AppData.exercises.forEach(function (ex) {
        var code = Storage.get('exercise_' + ex.id, null);
        if (code !== null) data.exercises[ex.id] = code;
    });

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'karate_learning_progress.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importProgress(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            if (data.theme) Storage.set('theme', data.theme);
            if (data.flashcard_sr) Storage.set('flashcard_sr', data.flashcard_sr);
            if (data.exercise_status) Storage.set('exercise_status', data.exercise_status);
            if (data.exercises) {
                Object.keys(data.exercises).forEach(function (key) {
                    Storage.set('exercise_' + key, data.exercises[key]);
                });
            }
            alert('Progress imported successfully! Reloading...');
            location.reload();
        } catch (err) {
            alert('Invalid backup file.');
        }
    };
    reader.readAsText(file);
}

window.switchDoc = switchDoc;
window.switchMode = switchMode;
window.toggleTheme = toggleTheme;
window.handleSearch = handleSearch;
window.setFilter = setFilter;
window.toggleQuizAnswer = toggleQuizAnswer;
window.markQuiz = markQuiz;
window.markFlashcard = markFlashcard;
window.revealSolution = revealSolution;
window.toggleEditor = toggleEditor;
window.markExerciseSolved = markExerciseSolved;
window.markExerciseUnsolved = markExerciseUnsolved;
window.resetExerciseCode = resetExerciseCode;
window.copySolution = copySolution;
window.cycleHint = cycleHint;
window.togglePreview = togglePreview;
window.toggleSection = toggleSection;
window.toggleBookmark = toggleBookmark;
window.scrollToExercise = scrollToExercise;
window.updateDashboard = updateDashboard;
window.exportProgress = exportProgress;
window.importProgress = importProgress;
