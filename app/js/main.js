import { Storage } from './storage.js';
import { initTheme, toggleTheme } from './theme.js';
import { extractFlashcards, extractQuiz, extractExercises } from './parser.js';
import { renderFlashcards, renderQuiz, renderExercises, toggleQuizAnswer, markQuiz, markFlashcard, revealSolution, toggleEditor } from './renderers.js';
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
        document.querySelectorAll('.flashcard').forEach(function(card) {
            var text = card.textContent.toLowerCase();
            var cat = card.querySelector('.flashcard-category').textContent.trim();
            var matchesQuery = text.includes(query);
            var matchesFilter = activeFilter === 'All' || cat === activeFilter.toLowerCase() || (activeFilter === 'Concept' && cat === 'concept');
            card.style.display = matchesQuery && matchesFilter ? '' : 'none';
        });
    } else if (activeMode === 'quiz') {
        document.querySelectorAll('.quiz-item').forEach(function(item) {
            var text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    } else if (activeMode === 'coding') {
        document.querySelectorAll('.exercise-card').forEach(function(card) {
            var text = card.textContent.toLowerCase();
            var lang = card.querySelector('.ex-lang').textContent.trim();
            var matchesQuery = text.includes(query);
            var matchesFilter = activeFilter === 'All' || lang === activeFilter.toLowerCase();
            card.style.display = matchesQuery && matchesFilter ? '' : 'none';
        });
    }
}

export function setFilter(filterBtn, filterVal) {
    document.querySelectorAll('.filter-chip').forEach(function(b) { b.classList.remove('active'); });
    filterBtn.classList.add('active');
    activeFilter = filterVal;
    handleSearch();
}

export function renderFilterChips(modeId) {
    var chipsContainer = document.getElementById('filterChips');
    var chips = ['All'];
    
    if (modeId === 'flashcards') {
        chips = ['All', 'Concept', 'Gotcha', 'API', 'Config'];
    } else if (modeId === 'coding') {
        chips = ['All', 'gherkin', 'java', 'javascript', 'yaml'];
    }
    
    if (chips.length > 1) {
        chipsContainer.innerHTML = chips.map(function(c) {
            var activeClass = c === 'All' ? 'active' : '';
            return '<button class="filter-chip ' + activeClass + '" onclick="setFilter(this, \'' + c + '\')">' + c + '</button>';
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
        masteredCount = Object.values(srData).filter(function(v) { return v >= 2; }).length;
        var fcPct = Math.round((masteredCount / totalCards) * 100);
        document.getElementById('stat-flashcards').textContent = fcPct + '%';
        document.getElementById('bar-flashcards').style.width = fcPct + '%';
    }

    // Quiz Score
    var totalQuiz = AppData.quizItems.length;
    var correctScore = 0;
    if (totalQuiz > 0) {
        // Find marked correct from UI or state
        var correctItems = document.querySelectorAll('.quiz-item .marked-correct').length;
        var quizPct = Math.round((correctItems / totalQuiz) * 100);
        document.getElementById('stat-quiz').textContent = quizPct + '%';
        document.getElementById('bar-quiz').style.width = quizPct + '%';
    }

    // Exercises
    var totalEx = AppData.exercises.length;
    var attemptedEx = 0;
    if (totalEx > 0) {
        AppData.exercises.forEach(function(ex) {
            if (Storage.get('exercise_' + ex.id, null) !== null) attemptedEx++;
        });
        var exPct = Math.round((attemptedEx / totalEx) * 100);
        document.getElementById('stat-exercises').textContent = attemptedEx + ' / ' + totalEx;
        document.getElementById('bar-exercises').style.width = exPct + '%';
    }
}

export function exportProgress() {
    var data = {
        theme: Storage.get('theme', 'dark'),
        flashcard_sr: Storage.get('flashcard_sr', {}),
        exercises: {}
    };
    
    AppData.exercises.forEach(function(ex) {
        var code = Storage.get('exercise_' + ex.id, null);
        if (code !== null) data.exercises[ex.id] = code;
    });

    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
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
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (data.theme) Storage.set('theme', data.theme);
            if (data.flashcard_sr) Storage.set('flashcard_sr', data.flashcard_sr);
            if (data.exercises) {
                Object.keys(data.exercises).forEach(function(key) {
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
window.updateDashboard = updateDashboard;
window.exportProgress = exportProgress;
window.importProgress = importProgress;
