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
    
    cards.forEach(function(c, i) {
        c.id = 'fc_' + c.question.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
        c.mastery = srData[c.id] || 0;
    });
    
    cards.sort(function(a, b) {
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
        setTimeout(function() { card.style.opacity = '1'; }, 300);
    }
    if (window.updateDashboard) window.updateDashboard();
}

export function renderQuiz(items) {
    var list = document.getElementById('quiz-list');
    if (!items.length) {
        list.innerHTML = '<div class="loading"><p>No quiz items generated.</p></div>';
        return;
    }
    list.innerHTML = items.map(function (q) {
        return '<div class="quiz-item" data-id="' + q.id + '">' +
            '<div class="quiz-question" onclick="toggleQuizAnswer(this)">' +
            '<div class="quiz-q-num">' + q.id + '</div>' +
            '<div class="quiz-q-text">' + q.question + '</div>' +
            '<button class="quiz-toggle">&#x2B;</button>' +
            '</div>' +
            '<div class="quiz-answer">' +
            '<div class="quiz-answer-inner">' +
            '<div class="quiz-answer-icon">&#x1F4A1;</div>' +
            '<div class="quiz-answer-text">' +
            '<strong>' + q.answer + '</strong>' +
            '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">&#x1F4CE; ' + q.source + '</div>' +
            '<div class="quiz-mark-btns">' +
            '<button class="quiz-mark-btn" onclick="event.stopPropagation();markQuiz(this,' + q.id + ',\'correct\')">&#x2705; I knew this</button>' +
            '<button class="quiz-mark-btn" onclick="event.stopPropagation();markQuiz(this,' + q.id + ',\'wrong\')">&#x274C; Got it wrong</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');
    updateQuizScore(items);
}

export var quizState = { correct: 0, wrong: 0 };

export function toggleQuizAnswer(el) {
    var item = el.closest('.quiz-item');
    item.classList.toggle('open');
    var toggle = item.querySelector('.quiz-toggle');
    toggle.innerHTML = item.classList.contains('open') ? '&#x2212;' : '&#x2B;';
}

export function markQuiz(btn, id, result) {
    var item = btn.closest('.quiz-item');
    var btns = item.querySelectorAll('.quiz-mark-btn');
    btns.forEach(function (b) { b.className = 'quiz-mark-btn'; });
    if (result === 'correct') {
        btn.classList.add('marked-correct');
        quizState.correct++;
    } else {
        btn.classList.add('marked-wrong');
        quizState.wrong++;
    }
    btn.disabled = true;
    updateQuizScore();
    if (window.updateDashboard) window.updateDashboard();
}

function updateQuizScore(items) {
    var total = document.querySelectorAll('.quiz-item').length;
    document.getElementById('quiz-correct').innerHTML = quizState.correct + ' &#x2705;';
    document.getElementById('quiz-wrong').innerHTML = quizState.wrong + ' &#x274C;';
    document.getElementById('quiz-total').innerHTML = (quizState.correct + quizState.wrong) + '/' + total;
}

export function resetQuiz() {
    quizState = { correct: 0, wrong: 0 };
    document.querySelectorAll('.quiz-item').forEach(function (item) {
        item.classList.remove('open');
        item.querySelectorAll('.quiz-mark-btn').forEach(function (b) {
            b.className = 'quiz-mark-btn';
            b.disabled = false;
        });
        var toggle = item.querySelector('.quiz-toggle');
        if (toggle) toggle.innerHTML = '&#x2B;';
    });
    updateQuizScore();
}

export function renderExercises(exercises) {
    var list = document.getElementById('exercise-list');
    if (!exercises.length) {
        list.innerHTML = '<div class="loading"><p>No exercises generated.</p></div>';
        return;
    }

    function prismLang(lang) {
        var map = {
            gherkin: 'java', java: 'java', javascript: 'javascript', js: 'javascript',
            json: 'json', yaml: 'yaml', bash: 'bash', text: 'markdown'
        };
        return map[lang] || 'markdown';
    }

    list.innerHTML = exercises.map(function (ex, i) {
        var safeCode = ex.code
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        var lang = prismLang(ex.lang);
        
        // Load saved code if it exists
        var savedCode = Storage.get('exercise_' + ex.id, null);
        var initialCode = savedCode !== null ? savedCode : (ex.setup || '');
        
        return '<div class="exercise-card" data-ex="' + ex.id + '">' +
            '<div class="exercise-card-header">' +
            '<div>' +
            '<div class="ex-num">Exercise #' + (i + 1) + '</div>' +
            '<div class="ex-title">' + ex.title + '</div>' +
            '</div>' +
            '<div class="ex-lang">' + ex.lang + '</div>' +
            '</div>' +
            '<div class="exercise-body">' +
            '<p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px">' +
            ex.description + '</p>' +

            '<div class="exercise-actions">' +
            '<button class="ex-btn ex-btn-primary" onclick="revealSolution(this)">&#x1F50D; Reveal Solution</button>' +
            '<button class="ex-btn ex-btn-secondary" onclick="toggleEditor(this)">&#x270F;&#xFE0F; Practice Area</button>' +
            '</div>' +

            '<div class="ex-solution">' +
            '<div class="ex-solution-label">&#x2705; Solution</div>' +
            '<pre><code class="language-' + lang + '">' + safeCode + '</code></pre>' +
            '</div>' +

            '<div class="ex-editor" style="display:none">' +
            '<textarea placeholder="Write your practice code here&#x2026;" spellcheck="false">' + initialCode + '</textarea>' +
            '<div class="save-status" style="font-size:0.75rem;color:var(--text-muted);text-align:right;margin-top:4px;"></div>' +
            '</div>' +

            '</div>' +
            '</div>';
    }).join('');

    document.querySelectorAll('#exercise-list pre code').forEach(function (block) {
        if (window.Prism) Prism.highlightElement(block);
    });

    // Attach smart editor listeners to all textareas
    document.querySelectorAll('#exercise-list textarea').forEach(function(textarea) {
        var card = textarea.closest('.exercise-card');
        var exId = card.getAttribute('data-ex');
        var statusEl = card.querySelector('.save-status');
        
        // Handle Tab key for indentation
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                // set textarea value to: text before caret + tab + text after caret
                this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 2;
                // Trigger input event to auto-save
                this.dispatchEvent(new Event('input'));
            }
        });
        
        // Auto-save on input with debouncing
        var timeout = null;
        textarea.addEventListener('input', function() {
            statusEl.textContent = 'Saving...';
            var val = this.value;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                Storage.set('exercise_' + exId, val);
                statusEl.innerHTML = 'Saved &#x2705;';
                if (window.updateDashboard) window.updateDashboard();
                setTimeout(function() { statusEl.textContent = ''; }, 2000);
            }, 500);
        });
    });
}

export function revealSolution(btn) {
    var card = btn.closest('.exercise-card');
    var sol = card.querySelector('.ex-solution');
    sol.classList.toggle('open');
    btn.innerHTML = sol.classList.contains('open') ? '&#x1F512; Hide Solution' : '&#x1F50D; Reveal Solution';
    if (sol.classList.contains('open')) {
        sol.querySelectorAll('pre code').forEach(function (b) {
            if (window.Prism) Prism.highlightElement(b);
        });
    }
}

export function toggleEditor(btn) {
    var card = btn.closest('.exercise-card');
    var editor = card.querySelector('.ex-editor');
    var isHidden = editor.style.display === 'none' || !editor.style.display;
    editor.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden ? '&#x1F4C1; Hide Practice Area' : '&#x270F;&#xFE0F; Practice Area';
    if (isHidden) {
        var ta = editor.querySelector('textarea');
        setTimeout(function () { ta.focus(); }, 100);
    }
}
