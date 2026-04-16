var available_languages = [
    'Persian',
    'German',
    'Spanish',
    'French',
    'Italian',
    'Korean',
    'Turkish',
    'Arabic',
    'Japanese',
    'Dutch',
    'Hindi',
    'English'
]

var available_programming_languages = [
    'Rust',
    'CPP'
]

var language_alphabets = {
    'Persian': 'ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی',
    'German': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Ä Ö Ü ß',
    'Spanish': 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z',
    'French': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z À Â Ç É È Ê Ë Î Ï Ô Ù Û Ü Œ Æ',
    'Italian': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z À È É Ì Î Ò Ó Ù Ú',
    'Korean': 'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
    'Turkish': 'A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z',
    'Arabic': 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي',
    'Japanese': 'あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん',
    'Dutch': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
    'Hindi': 'अ आ इ ई उ ऊ ए ओ क ख ग घ च छ ज झ ट ठ ड ढ त थ द ध न प फ ब भ म य र ल व श ष स ह',
    'English': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'
};

// BCP-47 language codes for TTS
var language_tts_codes = {
    'Persian': 'fa-IR', 'German': 'de-DE', 'Spanish': 'es-ES',
    'French': 'fr-FR', 'Italian': 'it-IT', 'Korean': 'ko-KR',
    'Turkish': 'tr-TR', 'Arabic': 'ar-SA', 'Japanese': 'ja-JP',
    'Dutch': 'nl-NL', 'Hindi': 'hi-IN', 'English': 'en-US'
};

var available_quiz_types = [
    'Crossword',
    'Multiple Choice',
    'Typing',
    'Hangman',
    'Flashcard'
];

var available_topics = [
    'Capitals',
    'Numbers',
    'Colors',
    'Animals',
    'Antonyms',
    'Common Words',
    'Common Sentences',
    'Body Parts',
    'Family',
    'Food'
];

quiz_started = false;
var hangman_ready = false;

// === Dark mode ===
function toggleDarkMode() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('goftan_theme', next);
    var icon = document.getElementById('theme_icon');
    if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function restoreTheme() {
    var saved = localStorage.getItem('goftan_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    var icon = document.getElementById('theme_icon');
    if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// === Word of the Day ===
function renderWordOfDay(language) {
    var container = document.getElementById('word_of_day');
    if (!container) return;
    container.style.display = 'none';

    var topics = ['Animals', 'Colors', 'Numbers'];
    var topicFile = topics[Math.floor(Math.random() * topics.length)];
    var filename = language + '/' + topicFile + '.json';

    d3.json(filename).then(function(data) {
        if (!data || data.length === 0) return;
        // Deterministic pick: hash of language + today's date
        var dateStr = new Date().toDateString();
        var seed = (language + dateStr).split('').reduce(function(acc, c) { return acc + c.charCodeAt(0); }, 0);
        var idx = seed % data.length;
        var entry = data[idx];

        container.style.display = '';
        d3.select('#wod_topic').text(topicFile);
        d3.select('#wod_question').text(entry.question);
        d3.select('#wod_answer').text(entry.choices[entry.answer]);
        d3.select('#wod_extra').text(entry.extra || '');
    }).catch(function() {});
}

// === Milestone badges ===
function getEarnedBadges() {
    try { return JSON.parse(localStorage.getItem('goftan_badges') || '[]'); } catch(e) { return []; }
}

function checkAndAwardBadges(pct) {
    var engagement = {};
    try { engagement = JSON.parse(localStorage.getItem('goftan_engagement') || '{}'); } catch(e) {}
    var sessions = 0;
    try {
        var hist = JSON.parse(localStorage.getItem('goftan_session_history') || '[]');
        sessions = hist.length;
    } catch(e) {}

    var stats = {
        streak: engagement.streak || 0,
        xp: engagement.xp || 0,
        lastPct: pct,
        totalSessions: sessions
    };
    var earned = getEarnedBadges();
    var newIds = checkNewBadges(stats, earned); // pure fn from logic.js
    if (newIds.length > 0) {
        var updated = earned.concat(newIds);
        localStorage.setItem('goftan_badges', JSON.stringify(updated));
    }
    return newIds;
}

function renderBadges(newBadgeIds) {
    // Show newly earned badge notifications
    var toastArea = document.getElementById('badge_toast_area');
    if (toastArea && newBadgeIds.length > 0) {
        newBadgeIds.forEach(function(id) {
            var badge = BADGES.find(function(b) { return b.id === id; });
            if (!badge) return;
            var el = document.createElement('div');
            el.className = 'badge-toast';
            el.innerHTML = '<span class="badge-toast-icon">' + badge.icon + '</span>' +
                           '<div><strong>Badge unlocked!</strong><br>' + badge.label + '</div>';
            toastArea.appendChild(el);
            setTimeout(function() { el.remove(); }, 4000);
        });
    }

    // Render all earned badges in results page
    var container = document.getElementById('badges_earned');
    if (!container) return;
    var earned = getEarnedBadges();
    if (earned.length === 0) { container.style.display = 'none'; return; }
    container.style.display = '';
    var inner = document.getElementById('badges_list');
    if (!inner) return;
    inner.innerHTML = '';
    earned.forEach(function(id) {
        var badge = BADGES.find(function(b) { return b.id === id; });
        if (!badge) return;
        var el = document.createElement('div');
        el.className = 'badge-chip' + (newBadgeIds.includes(id) ? ' badge-chip-new' : '');
        el.title = badge.desc;
        el.innerHTML = '<span>' + badge.icon + '</span><span>' + badge.label + '</span>';
        inner.appendChild(el);
    });
}

// === Topic mastery tracking ===
function saveTopicMastery(language, wrongAnswers, totalQuestions, topicsUsed) {
    var key = 'goftan_mastery_' + language.toLowerCase();
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
    var updated = updateTopicMastery(stored, wrongAnswers, totalQuestions, topicsUsed); // pure fn from logic.js
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
}

function renderTopicMastery(language) {
    var key = 'goftan_mastery_' + language.toLowerCase();
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}

    document.querySelectorAll('.mycheckbox').forEach(function(cb) {
        var topicLabel = cb.closest('label');
        if (!topicLabel) return;
        var topic = cb.value;
        var data = stored[topic];
        var pct = getTopicMasteryPct(data); // pure fn from logic.js
        var existing = topicLabel.querySelector('.mastery-bar-wrap');
        if (existing) existing.remove();
        if (pct === null) return;
        var color = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
        var bar = document.createElement('div');
        bar.className = 'mastery-bar-wrap';
        bar.innerHTML = '<div class="mastery-bar-track"><div class="mastery-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
                        '<span class="mastery-pct">' + pct + '%</span>';
        topicLabel.appendChild(bar);
    });
}

// === Export progress ===
function exportProgress() {
    var lang = is_language_selected() ? get_selected_language() : 'All';
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem('goftan_session_history') || '[]'); } catch(e) {}
    if (rows.length === 0) { showFeedback('No session history to export yet.', 'warning'); return; }

    var csv = 'Try,Language,Correct,Incorrect,Skipped\n';
    rows.forEach(function(r) { csv += r.join(',') + '\n'; });

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'goftan_progress_' + lang + '_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// === Flashcard mode ===
var flashcards = [];
var flashcardIndex = 0;
var flashcardFlipped = false;

function startFlashcards(quizData) {
    flashcards = quizData.slice(0, parseInt(d3.select('#question_size').html()) || 10);
    flashcardIndex = 0;
    flashcardFlipped = false;
    renderFlashcard();
    // Navigation is handled by the caller — don't auto-navigate here
}

function renderFlashcard() {
    if (flashcards.length === 0) return;
    var card = flashcards[flashcardIndex];
    d3.select('#fc_counter').text((flashcardIndex + 1) + ' / ' + flashcards.length);
    d3.select('#fc_extra').text(card.extra || '');
    d3.select('#fc_front').text(card.question);
    d3.select('#fc_back').text(card.choices[card.answer]);
    d3.select('#fc_card').classed('flipped', false);
    d3.select('#fc_know').property('disabled', true).style('display', 'none');
    d3.select('#fc_skip').property('disabled', true).style('display', 'none');
    d3.select('#fc_flip_hint').style('display', '');
    flashcardFlipped = false;
}

function flipFlashcard() {
    if (flashcardFlipped) return;
    flashcardFlipped = true;
    d3.select('#fc_card').classed('flipped', true);
    d3.select('#fc_flip_hint').style('display', 'none');
    d3.select('#fc_know').property('disabled', false).style('display', '');
    d3.select('#fc_skip').property('disabled', false).style('display', '');
}

function flashcardKnow() {
    // Update SRS state
    var card = flashcards[flashcardIndex];
    updateSRSCard(card.question, 5);
    nextFlashcard(true);
}

function flashcardSkip() {
    var card = flashcards[flashcardIndex];
    updateSRSCard(card.question, 1);
    nextFlashcard(false);
}

function nextFlashcard(knew) {
    flashcardIndex++;
    if (flashcardIndex >= flashcards.length) {
        showFeedback('Flashcard session complete!', 'success');
        selectPage('language_page');
        return;
    }
    renderFlashcard();
}

// === Text-to-Speech ===
var ttsEnabled = typeof speechSynthesis !== 'undefined';

function speakText(text, lang) {
    if (!ttsEnabled || !text) return;
    try {
        speechSynthesis.cancel();
        var utt = new SpeechSynthesisUtterance(text);
        utt.lang = lang || 'en-US';
        utt.rate = 0.9;
        speechSynthesis.speak(utt);
    } catch(e) {}
}

function speakCurrentQuestion() {
    if (!quiz || !quiz[countQues]) return;
    var lang = is_language_selected() ? (language_tts_codes[get_selected_language()] || 'en-US') : 'en-US';
    speakText(quiz[countQues].question, lang);
}

// === Typing mode ===
var typingModeActive = false;

function submitTypedAnswer() {
    var input = document.getElementById('typing_input');
    if (!input) return;
    var typed = input.value.trim();
    if (!typed) return;

    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    input.disabled = true;
    document.getElementById('typing_submit').disabled = true;

    var correctAnswer = quiz[countQues].choices[quiz[countQues].answer];
    var isCorrect = normalizeAnswer(typed) === normalizeAnswer(correctAnswer);

    colorCorrectAnswer();

    var isRequeued = !!quiz[countQues]._requeued;
    if (isCorrect) {
        if (!isRequeued) countCorrect++;
        playCorrectSound();
        input.style.borderColor = 'var(--c-success)';
        input.style.background = 'var(--c-success-bg)';
    } else {
        if (!isRequeued) {
            countIncorrect++;
            wrongAnswers.push({
                question: quiz[countQues].question,
                extra: quiz[countQues].extra || '',
                yourAnswer: typed,
                correctAnswer: correctAnswer,
                _topic: quiz[countQues]._topic || 'Unknown'
            });
            var requeue = Object.assign({}, quiz[countQues], { _requeued: true });
            var insertAt = calcRequeueInsertAt(countQues, quiz.length);
            quiz.splice(insertAt, 0, requeue);
            d3.select('#question_size').html(parseInt(d3.select('#question_size').html()) + 1);
        }
        playWrongSound();
        input.style.borderColor = 'var(--c-error)';
        input.style.background = 'var(--c-error-bg)';
        // Show correct answer hint
        var hint = document.getElementById('typing_hint');
        if (hint) { hint.textContent = 'Correct: ' + correctAnswer; hint.style.display = ''; }
    }

    // Track word for vocab estimator
    trackVocabWord(correctAnswer);

    autoAdvanceTimer = setTimeout(function() {
        autoAdvanceTimer = null;
        nextQuestion();
    }, 1500);
}

function normalizeAnswer(str) {
    return str.toLowerCase()
              .trim()
              .replace(/[àáâãä]/g, 'a')
              .replace(/[èéêë]/g, 'e')
              .replace(/[ìíîï]/g, 'i')
              .replace(/[òóôõö]/g, 'o')
              .replace(/[ùúûü]/g, 'u')
              .replace(/[ñ]/g, 'n')
              .replace(/[ç]/g, 'c')
              .replace(/[ß]/g, 'ss');
}

// === Undo last answer ===
var lastAnswerState = null;

function saveAnswerStateForUndo() {
    lastAnswerState = {
        countQues: countQues,
        countCorrect: countCorrect,
        countIncorrect: countIncorrect,
        wrongAnswersLen: wrongAnswers.length,
        questionSize: parseInt(d3.select('#question_size').html())
    };
}

function undoLastAnswer() {
    if (!lastAnswerState) return;
    // Roll back state
    countQues = lastAnswerState.countQues;
    countCorrect = lastAnswerState.countCorrect;
    countIncorrect = lastAnswerState.countIncorrect;
    wrongAnswers.splice(lastAnswerState.wrongAnswersLen);
    d3.select('#question_size').html(lastAnswerState.questionSize);
    d3.select('#question_number').html(countQues + 1);
    if (quiz.length > lastAnswerState.questionSize) quiz.splice(lastAnswerState.countQues + 3, 1); // remove requeue
    lastAnswerState = null;
    d3.select('#undo_btn').style('display', 'none');
    decolorCorrectAnswer();
    fill_qa(quiz[countQues]);
}

// === Vocabulary size estimator ===
function trackVocabWord(word) {
    if (!is_language_selected() || !word) return;
    var lang = get_selected_language();
    var key = 'goftan_vocab_' + lang.toLowerCase();
    var set;
    try { set = new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch(e) { set = new Set(); }
    set.add(word.toLowerCase().trim());
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

function getVocabCount(language) {
    var key = 'goftan_vocab_' + language.toLowerCase();
    try { return JSON.parse(localStorage.getItem(key) || '[]').length; } catch(e) { return 0; }
}

function renderVocabEstimate(language) {
    var el = document.getElementById('vocab_estimate');
    if (!el) return;
    var count = getVocabCount(language);
    if (count === 0) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = 'You\'ve encountered ~' + count + ' ' + language + ' words';
}

// === Activity tracking (heatmap data) ===
function recordTodayActivity(correct) {
    var key = 'goftan_activity';
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
    var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    data[today] = (data[today] || 0) + correct;
    localStorage.setItem(key, JSON.stringify(data));
}

function renderActivityHeatmap() {
    var container = document.getElementById('activity_heatmap');
    if (!container) return;
    var data = {};
    try { data = JSON.parse(localStorage.getItem('goftan_activity') || '{}'); } catch(e) {}

    var today = new Date();
    var days = 91; // 13 weeks
    var cells = [];
    for (var i = days - 1; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        cells.push({ date: key, count: data[key] || 0 });
    }

    var maxCount = Math.max.apply(null, cells.map(function(c) { return c.count; })) || 1;

    container.innerHTML = '';
    var svg = d3.select(container).append('svg')
        .attr('width', '100%')
        .attr('viewBox', '0 0 ' + (13 * 14 + 10) + ' ' + (7 * 14 + 20))
        .attr('preserveAspectRatio', 'xMinYMid meet');

    // Week columns
    for (var w = 0; w < 13; w++) {
        for (var dy = 0; dy < 7; dy++) {
            var idx = w * 7 + dy;
            if (idx >= cells.length) continue;
            var cell = cells[idx];
            var intensity = cell.count === 0 ? 0 : Math.max(0.15, cell.count / maxCount);
            var alpha = cell.count === 0 ? 0.1 : intensity;
            svg.append('rect')
                .attr('x', w * 14 + 5)
                .attr('y', dy * 14 + 10)
                .attr('width', 11).attr('height', 11)
                .attr('rx', 2)
                .style('fill', cell.count === 0 ? 'var(--c-border)' : 'var(--c-primary)')
                .style('opacity', cell.count === 0 ? 0.5 : Math.max(0.2, intensity))
                .append('title').text(cell.date + ': ' + cell.count + ' correct');
        }
    }
}

// === Session restore ===
function saveSessionState() {
    if (!quiz_started || !quiz.length) return;
    try {
        sessionStorage.setItem('goftan_session', JSON.stringify({
            quiz: quiz,
            countQues: countQues,
            countCorrect: countCorrect,
            countIncorrect: countIncorrect,
            countViewed: countViewed,
            wrongAnswers: wrongAnswers,
            originalQuestionCount: originalQuestionCount,
            language: is_language_selected() ? get_selected_language() : null,
            questionSize: parseInt(d3.select('#question_size').html())
        }));
    } catch(e) {}
}

function restoreSessionState() {
    try {
        var raw = sessionStorage.getItem('goftan_session');
        if (!raw) return false;
        var s = JSON.parse(raw);
        if (!s.quiz || !s.quiz.length) return false;

        // Ask user
        var restore = confirm('You have an unfinished quiz (' + s.language + ', question ' + (s.countQues + 1) + ' of ' + s.questionSize + '). Continue where you left off?');
        if (!restore) { sessionStorage.removeItem('goftan_session'); return false; }

        quiz = s.quiz;
        countQues = s.countQues;
        countCorrect = s.countCorrect;
        countIncorrect = s.countIncorrect;
        countViewed = s.countViewed;
        wrongAnswers = s.wrongAnswers || [];
        originalQuestionCount = s.originalQuestionCount;
        quiz_started = true;

        d3.select('#question_size').html(s.questionSize);
        d3.select('#question_number').html(s.countQues + 1);

        if (s.language) {
            var radio = document.querySelector('.languages_checkbox[value="' + s.language + '"]');
            if (radio) {
                radio.checked = true;
                radio.parentNode.classList.add('language-selected');
                d3.select('#known_language').text('Enjoy learning ' + s.language);
            }
        }
        fill_qa(quiz[countQues]);
        selectPage('question_page');
        return true;
    } catch(e) {
        sessionStorage.removeItem('goftan_session');
        return false;
    }
}

// === URL-based quiz config ===
function applyUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get('lang');
    var count = params.get('count');
    var topics = params.get('topics');
    var level = params.get('level');

    if (lang) {
        var radio = document.querySelector('.languages_checkbox[value="' + lang + '"]');
        if (radio) { radio.checked = true; radio.parentNode.classList.add('language-selected'); }
    }
    if (count) {
        var numEl = document.getElementById('num_of_questions');
        if (numEl) numEl.value = parseInt(count) || 10;
    }
    if (topics) {
        var topicList = topics.split(',').map(function(t) { return t.trim(); });
        document.querySelectorAll('.mycheckbox').forEach(function(cb) {
            cb.checked = topicList.includes(cb.value);
        });
    }
    if (level) {
        var levelList = level.split(',').map(function(l) { return l.trim(); });
        document.querySelectorAll('.mycheckboxqtypes[name="levels"]').forEach(function(cb) {
            cb.checked = levelList.includes(cb.value);
        });
    }
}

function buildShareUrl() {
    var lang = is_language_selected() ? get_selected_language() : '';
    var count = document.getElementById('num_of_questions') ? document.getElementById('num_of_questions').value : '10';
    var topics = Array.from(document.querySelectorAll('.mycheckbox:checked')).map(function(el) { return el.value; }).join(',');
    var levels = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked')).map(function(el) { return el.value; }).join(',');
    var url = window.location.origin + window.location.pathname + '?lang=' + encodeURIComponent(lang) + '&count=' + count + '&topics=' + encodeURIComponent(topics) + '&level=' + encodeURIComponent(levels);
    return url;
}

// === Keyboard shortcut help modal ===
function toggleShortcutHelp() {
    var modal = document.getElementById('shortcut_modal');
    if (!modal) return;
    var isVisible = modal.style.display !== 'none';
    modal.style.display = isVisible ? 'none' : 'flex';
}

// === Page title update ===
function updatePageTitle(language) {
    document.title = language ? 'Goftan — Learn ' + language : 'Goftan';
    document.documentElement.setAttribute('lang', language_tts_codes[language] ? language_tts_codes[language].split('-')[0] : 'en');
}

// === Share result card ===
function shareResult(pct, language) {
    var text = 'I scored ' + pct + '% learning ' + language + ' on Goftan! 🌍 https://goftan.github.io/quiz';
    if (navigator.share) {
        navigator.share({ title: 'Goftan Quiz Result', text: text, url: 'https://goftan.github.io/quiz' }).catch(function() {});
    } else {
        navigator.clipboard.writeText(text).then(function() {
            showFeedback('Result copied to clipboard!', 'success');
        }).catch(function() {
            showFeedback('Share: ' + text, 'info');
        });
    }
}

// === Bookmark words ===
function getBookmarks(language) {
    var key = 'goftan_bookmarks_' + (language || 'all').toLowerCase();
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}

function toggleBookmark(word, question, language) {
    var key = 'goftan_bookmarks_' + (language || 'all').toLowerCase();
    var bookmarks = getBookmarks(language);
    var idx = bookmarks.findIndex(function(b) { return b.word === word; });
    if (idx !== -1) {
        bookmarks.splice(idx, 1);
    } else {
        bookmarks.push({ word: word, question: question, addedAt: new Date().toISOString() });
    }
    localStorage.setItem(key, JSON.stringify(bookmarks));
    return idx === -1; // true = added
}

function renderBookmarks() {
    var lang = is_language_selected() ? get_selected_language() : 'all';
    var bookmarks = getBookmarks(lang);
    var container = document.getElementById('bookmarks_list');
    var section = document.getElementById('bookmarks_section');
    if (!container || !section) return;
    if (bookmarks.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';
    container.innerHTML = '';
    bookmarks.forEach(function(b) {
        var chip = document.createElement('div');
        chip.className = 'bookmark-chip';
        chip.innerHTML = '<span class="bm-q">' + b.question + '</span>' +
                         '<span class="bm-arrow">→</span>' +
                         '<span class="bm-w">' + b.word + '</span>' +
                         '<button class="bm-remove" title="Remove bookmark" onclick="removeBookmark(\'' + b.word.replace(/'/g,"\\'"  ) + '\')">×</button>';
        container.appendChild(chip);
    });
}

function removeBookmark(word) {
    var lang = is_language_selected() ? get_selected_language() : 'all';
    toggleBookmark(word, '', lang);
    renderBookmarks();
}

// === SRS card state management ===
function getSRSDeck(language) {
    var key = 'goftan_srs_' + language.toLowerCase();
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { return {}; }
}

function saveSRSDeck(language, deck) {
    var key = 'goftan_srs_' + language.toLowerCase();
    localStorage.setItem(key, JSON.stringify(deck));
}

function updateSRSCard(word, grade) {
    if (!is_language_selected()) return;
    var lang = get_selected_language();
    var deck = getSRSDeck(lang);
    deck[word] = sm2Update(deck[word] || {}, grade); // pure fn from logic.js
    saveSRSDeck(lang, deck);
}

function startSRSReview() {
    if (!is_language_selected()) { showFeedback('Please select a language first.', 'warning'); return; }
    var lang = get_selected_language();
    var deck = getSRSDeck(lang);
    var today = new Date().toDateString();
    var dueWords = getDueCards(deck, today); // pure fn from logic.js

    if (dueWords.length === 0) {
        showFeedback('No cards due for review today! Come back tomorrow.', 'success');
        return;
    }

    // Filter quiz to only due words
    var dueSet = new Set(dueWords);
    var dueQuiz = quiz.filter(function(q) {
        return dueSet.has(q.question) || dueSet.has(q.choices[q.answer]);
    });

    if (dueQuiz.length === 0) {
        showFeedback('Due cards found, but no matching questions loaded. Start a quiz first to build your deck.', 'warning');
        return;
    }

    flashcards = dueQuiz;
    flashcardIndex = 0;
    flashcardFlipped = false;
    d3.select('#question_size').html(dueQuiz.length);
    renderFlashcard();
    selectPage('flashcard_page');
}


// === Timer ===
var questionTimer = null;
var autoAdvanceTimer = null;
var timerDuration = 15;

// === Sound ===
var soundEnabled = true;
var _audioCtx = null;

function getAudioCtx() {
    if (!_audioCtx) {
        try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return _audioCtx;
}

function playCorrectSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioCtx();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
    } catch(e) {}
}

function playWrongSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioCtx();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    var icon = document.getElementById('sound_icon');
    var btn  = document.getElementById('sound_toggle');
    if (icon) icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    if (btn)  btn.classList.toggle('muted', !soundEnabled);
}

// === Question timer ===
function startQuestionTimer() {
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    var remaining = timerDuration;
    updateTimerBar(remaining);
    questionTimer = setInterval(function() {
        remaining--;
        updateTimerBar(remaining);
        if (remaining <= 0) {
            clearQuestionTimer();
            if (!d3.select('#opt1').property('disabled')) {
                for (var i = 1; i <= 4; i++) d3.select('#opt' + i).property('disabled', true);
                var q = quiz[countQues];
                if (!q._requeued) {
                    countIncorrect++;
                    wrongAnswers.push({
                        question: q.question,
                        extra: q.extra || '',
                        yourAnswer: '⏱ Timed out',
                        correctAnswer: q.choices[q.answer],
                        _topic: q._topic || 'Unknown'
                    });
                }
                colorCorrectAnswer();
                playWrongSound();
                autoAdvanceTimer = setTimeout(function() {
                    autoAdvanceTimer = null;
                    nextQuestion();
                }, 1500);
            }
        }
    }, 1000);
}

function clearQuestionTimer() {
    if (questionTimer) { clearInterval(questionTimer); questionTimer = null; }
}

function updateTimerBar(remaining) {
    var fill  = document.getElementById('question_timer_fill');
    var label = document.getElementById('question_timer_label');
    if (!fill || !label) return;
    var pct = (remaining / timerDuration) * 100;
    fill.style.width = pct + '%';
    if (pct > 50)       fill.style.background = 'var(--c-primary)';
    else if (pct > 25)  fill.style.background = '#F59E0B';
    else                fill.style.background = 'var(--c-error)';
    label.textContent = remaining + 's';
}

// === Streak + XP ===
function updateStreakAndXP(correct, total) {
    var today = new Date().toDateString();
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    var raw = localStorage.getItem('goftan_engagement');
    var stored = raw ? JSON.parse(raw) : {};
    var data = calcStreakAndXP(stored, today, yesterday, correct); // pure fn from logic.js
    localStorage.setItem('goftan_engagement', JSON.stringify(data));
    return data;
}

function renderEngagementRow(eng) {
    var row = d3.select('#engagement_row').html('');

    var sb = row.append('div').attr('class', 'streak-badge');
    sb.append('span').attr('class', 'streak-icon').text('🔥');
    var si = sb.append('div').attr('class', 'streak-info');
    si.append('div').attr('class', 'streak-count').text(eng.streak + '-day streak');
    si.append('div').attr('class', 'streak-sub').text(eng.streak > 1 ? 'Keep it up!' : 'Day 1 — come back tomorrow!');

    var xb = row.append('div').attr('class', 'xp-badge');
    xb.append('span').attr('class', 'xp-icon').text('⚡');
    var xi = xb.append('div').attr('class', 'xp-info');
    xi.append('div').attr('class', 'xp-earned').text('+' + eng.earnedXP + ' XP');
    xi.append('div').attr('class', 'xp-total').text(
        eng.xp + ' total' + (eng.streakBonus > 0 ? ' · +' + eng.streakBonus + ' streak bonus' : '')
    );
}

// === Score trend history ===
function saveAndGetScoreHistory(language, pct) {
    var key = 'goftan_scores_' + language.toLowerCase();
    var stored = localStorage.getItem(key);
    var history = appendScoreHistory(stored ? JSON.parse(stored) : [], pct); // pure fn from logic.js
    localStorage.setItem(key, JSON.stringify(history));
    return history;
}

function renderTrendChart(history, language) {
    var container = document.getElementById('trendPlot');
    if (!container) return;
    if (history.length < 2) {
        container.style.display = 'none';
        return;
    }
    container.style.display = '';
    var labels = history.map(function(_, i) { return 'Session ' + (i + 1); });
    var trendData = [{
        x: labels, y: history,
        type: 'scatter', mode: 'lines+markers',
        name: 'Score %',
        line: { color: '#22C55E', width: 2 },
        marker: { color: '#22C55E', size: 8 },
        fill: 'tozeroy', fillcolor: 'rgba(34,197,94,0.08)'
    }];
    var trendLayout = {
        xaxis: { fixedrange: true, showticklabels: history.length <= 10 },
        yaxis: { title: 'Score %', range: [0, 100], fixedrange: true, dtick: 25 },
        title: { text: language + ' — Score Trend', font: { size: 14 } },
        margin: { t: 36, b: 30, l: 48, r: 10 },
        plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'inherit' }
    };
    Plotly.newPlot('trendPlot', trendData, trendLayout, { responsive: true, displayModeBar: false });
}

// === Weak topic recommendation ===
function renderRecommendation() {
    var container = d3.select('#weak_topic_rec').html('');
    var weak = getWeakTopic(wrongAnswers); // pure fn from logic.js
    if (!weak) return;

    var topicName = weak.topic;
    var missCount = weak.count;

    var card = container.append('div').attr('class', 'recommendation-card');
    var txt = card.append('div').attr('class', 'rec-text');
    txt.append('div').attr('class', 'rec-title')
        .text('💡 Weak spot: ' + topicName);
    txt.append('div').attr('class', 'rec-sub')
        .text('You missed ' + missCount + ' question' + (missCount > 1 ? 's' : '') + ' from this topic. Practice it now?');
    card.append('button').attr('class', 'rec-btn')
        .html('<i class="fas fa-redo"></i> Drill ' + topicName)
        .on('click', function() { startTopicDrill(topicName); });
}

// === Confetti ===
function launchConfetti() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var colors = ['#22C55E','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#FBBF24'];
    var particles = [];
    for (var i = 0; i < 130; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * 120,
            w: 7 + Math.random() * 8,
            h: 4 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 4,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.18
        });
    }
    var start = Date.now();
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var elapsed = Date.now() - start;
        var alpha = Math.max(0, 1 - Math.max(0, elapsed - 2000) / 1000);
        particles.forEach(function(p) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.angle += p.spin;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (elapsed < 3000) requestAnimationFrame(draw);
        else canvas.remove();
    }
    requestAnimationFrame(draw);
}

// === Session history persistence ===
function saveSessionEntry(tryNum, language, correct, incorrect, skipped) {
    var stored = localStorage.getItem('goftan_session_history');
    var rows = stored ? JSON.parse(stored) : [];
    rows.push([tryNum, language, correct, incorrect, skipped]);
    localStorage.setItem('goftan_session_history', JSON.stringify(rows));
}

function loadSessionHistory() {
    var stored = localStorage.getItem('goftan_session_history');
    if (!stored) return;
    var rows;
    try { rows = JSON.parse(stored); } catch(e) { return; }
    d3.select('#result_table').html('');
    rows.forEach(function(row) {
        d3.select('#result_table').append('tr')
            .selectAll('td').data(row).enter().append('td').text(function(d) { return d; });
    });
}

// === Personal best ===
function getPersonalBestForLanguage(language) {
    var stored = localStorage.getItem('goftan_scores_' + language.toLowerCase());
    if (!stored) return null;
    return getPersonalBest(JSON.parse(stored)); // pure fn from logic.js
}

// === Quiz progress bar ===
function updateQuizProgress() {
    var fill = document.getElementById('quiz_progress_fill');
    if (!fill) return;
    var total = parseInt(d3.select('#question_size').html()) || 10;
    fill.style.width = (countQues / total * 100) + '%';
}

// === Difficulty nudge ===
function renderDifficultyNudge(pct) {
    var container = d3.select('#difficulty_nudge').html('');
    var selected = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked'))
                        .map(function(el) { return el.value; });
    var nextLevel = getNextDifficultyLevel(pct, selected); // pure fn from logic.js
    if (!nextLevel) return;
    var card = container.append('div').attr('class', 'nudge-card');
    card.append('div').attr('class', 'nudge-text')
        .html('🚀 You scored ' + pct + '%! Ready to try <strong>' + nextLevel + '</strong>?');
    card.append('button').attr('class', 'rec-btn')
        .text('Try ' + nextLevel)
        .on('click', function() {
            document.querySelectorAll('.mycheckboxqtypes[name="levels"]').forEach(function(cb) {
                cb.checked = (cb.value === nextLevel);
            });
            restartQuiz();
        });
}

function startTopicDrill(topic) {
    countCorrect = 0; countIncorrect = 0; countViewed = 0; countQues = 0;
    wrongAnswers = [];
    quiz_started = false; hangman_ready = false;
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    d3.select('#question_number').html(1);
    d3.select('#wrong_answers_review').html('');
    d3.select('#weak_topic_rec').html('');

    // Rebuild topic checkboxes, then check only the target topic
    fill_topic_checkboxes();
    document.querySelectorAll('.mycheckbox').forEach(function(cb) {
        cb.checked = (cb.value === topic);
    });
    startQuiz();
}

init_nav_menu();

function fill_language_checkboxes() {
    d3.select('#language_checkboxes').selectAll('label').data(available_languages)
        .enter().append('label').attr('class','radiocontainer')
        .html(function(d){return '<input type="radio" name="topics" value="'+d+'" class="languages_checkbox">'
                                    + d +'<span class="radiocheckmark"></span>';});

    // Highlight the selected language card and show Word of the Day
    d3.selectAll('.languages_checkbox').on('change', function() {
        d3.selectAll('.radiocontainer').classed('language-selected', false);
        if (this.checked) {
            d3.select(this.parentNode).classed('language-selected', true);
            renderWordOfDay(this.value);
            updatePageTitle(this.value);
        }
    });
}

function fill_quiz_type_checkboxes() {
        d3.select('#quiz_type_checkboxes').selectAll('label').data(available_quiz_types)
        .enter().append('label').text(function(d){return d;}).attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="' + d +'" checked="checked" class="mycheckboxqtypes">'
                                    + d +'<span class="checkmark"></span>';});
}

fill_language_checkboxes();
fill_quiz_type_checkboxes();
restoreSettings();
// if(localStorage.getItem('lang') != null) {
//     startLearningWithKnownLanguage();
// }

// function startLearningWithKnownLanguage() {
//     selectPage('tasks_page');
//     d3.select('#known_language').text('Enjoy learning ' + localStorage.getItem('lang') );
//     fill_topic_checkboxes();
// }

function fill_topic_checkboxes() {
    // Clear and rebuild to avoid stale state across language switches
    const container = d3.select('#topics_checkboxes');
    container.html('');
    container.selectAll('label').data(available_topics)
        .enter().append('label').attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="' + d +'" checked="checked" class="mycheckbox">'
                                  + d +'<span class="checkmark"></span>';});
}

function saveSettings() {
    // Only persist language and question count — checkboxes always default to all-selected
    const settings = {
        language: is_language_selected() ? get_selected_language() : null,
        numQuestions: document.getElementById('num_of_questions').value,
    };
    localStorage.setItem('quizSettings', JSON.stringify(settings));
}

function restoreSettings() {
    try {
        const raw = localStorage.getItem('quizSettings');
        if (!raw) return;
        const s = JSON.parse(raw);

        if (s.language) {
            const radio = document.querySelector(`.languages_checkbox[value="${s.language}"]`);
            if (radio) {
                radio.checked = true;
                radio.parentNode.classList.add('language-selected');
            }
        }
        if (s.numQuestions) {
            document.getElementById('num_of_questions').value = s.numQuestions;
        }
    } catch(e) {}
}

function applyPendingCheckboxSettings() {
    // Ensure all topics and quiz types are checked (always the default)
    document.querySelectorAll('.mycheckbox').forEach(el => { el.checked = true; });
    document.querySelectorAll('.mycheckboxqtypes[name="topics"]').forEach(el => { el.checked = true; });
}

// shuffleArray is provided by logic.js (loaded before this script)

function fill_qa(q) {
    d3.select("#extra").html(q._requeued ? '🔄 Try again' : (q.extra || ''));
    d3.select("#question").html(q.question);

    var isTyping = typingModeActive;
    d3.select('#typing_area').style('display', isTyping ? '' : 'none');
    d3.select('#choices_area').style('display', isTyping ? 'none' : '');

    if (isTyping) {
        var input = document.getElementById('typing_input');
        var hint = document.getElementById('typing_hint');
        if (input) { input.value = ''; input.disabled = false; input.style.borderColor = ''; input.style.background = ''; input.focus(); }
        if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
        var submitBtn = document.getElementById('typing_submit');
        if (submitBtn) submitBtn.disabled = false;
    } else {
        for (var i = 0; i <= 3; i++) {
            d3.select('#opt' + (i + 1)).html(q.choices[i]);
        }
    }

    // Auto-speak if TTS is on
    if (document.getElementById('tts_toggle') && document.getElementById('tts_toggle').classList.contains('active')) {
        var lang = is_language_selected() ? (language_tts_codes[get_selected_language()] || 'en-US') : 'en-US';
        setTimeout(function() { speakText(q.question, lang); }, 100);
    }

    updateQuizProgress();
    startQuestionTimer();
}

var countQues=0;
var quiz = [];
var countCorrect = 0;
var countIncorrect = 0;
var countViewed = 0;
var wrongAnswers = [];
var originalQuestionCount = 0;

function toggleAllLevels(link) {
    const boxes = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]'));
    const allChecked = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !allChecked; });
    link.textContent = allChecked ? 'Select All' : 'Select None';
    // Trigger beginner toggle in case Beginner was just checked/unchecked
    onBeginnerToggle();
}

function toggleAllTopics(link) {
    const boxes = Array.from(document.querySelectorAll('.mycheckbox'));
    const allChecked = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !allChecked; });
    link.textContent = allChecked ? 'Select All' : 'Select None';
}

function onBeginnerToggle() {
    const isChecked = document.querySelector('.mycheckboxqtypes[value="Beginner"]').checked;
    document.getElementById('beginner_note').style.display = isChecked ? 'block' : 'none';
    document.getElementById('topics_checkboxes').style.opacity = isChecked ? '0.4' : '1';
    document.getElementById('topics_checkboxes').style.pointerEvents = isChecked ? 'none' : '';
    document.getElementById('quiz_types').style.opacity = isChecked ? '0.4' : '1';
    document.getElementById('quiz_types').style.pointerEvents = isChecked ? 'none' : '';
}

// Beginner-level topics: numbers, colors, capitals, animals (no sentences or vocab words)
var beginner_topics = ['Numbers', 'Colors', 'Capitals', 'Animals'];

function startQuiz() {
    saveSettings();
    d3.select('#question_size').html(parseInt(d3.select("#num_of_questions").node().value));
    let readers = [];
    let topicNames = [];

    const selectedLevels = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked')).map(el => el.value);
    const isBeginner = selectedLevels.includes('Beginner');

    if (isBeginner) {
        // Only load Numbers and Colors regardless of topic checkboxes
        beginner_topics.forEach(function(topic) {
            readers.push(d3.json(get_selected_language() + '/' + topic + '.json'));
            topicNames.push(topic);
        });
    } else {
        d3.selectAll('.mycheckbox:checked').each(function() {
            const topicLabel = d3.select(this).node().value;
            var topic_name = topicLabel.replaceAll(' ','') + '.json';
            readers.push(d3.json(get_selected_language() + '/' + topic_name));
            topicNames.push(topicLabel);
        });
    }

    Promise.allSettled(readers).then(function(files) {
        quizall = [];
        for (let i = 0; i < files.length; i++) {
            if (files[i].status === 'fulfilled' && files[i].value) {
                const qs = files[i].value;
                qs.forEach(function(q) { if (!q._topic) q._topic = topicNames[i] || 'Unknown'; });
                quizall.push(qs);
            }
        }
        quiz = [].concat.apply([], quizall);

        // Beginner: exclude sentences and vocabulary/word questions
        if (isBeginner) {
            const beginnerExcluded = ['sentence', 'common sentences', 'synonym/antonym', 'words'];
            quiz = quiz.filter(q => !beginnerExcluded.includes(q.type));
        } else if (selectedLevels.length > 0) {
            // Filter by selected levels; questions without a level field are always included
            quiz = quiz.filter(q => !q.level || selectedLevels.includes(q.level));
        }

        shuffleArray(quiz);

        // Shuffle answer choices within each question so correct answer isn't positionally predictable
        quiz.forEach(function(q) {
            if (q.choices && q.choices.length === 4 && typeof q.answer === 'number') {
                var correctText = q.choices[q.answer];
                shuffleArray(q.choices);
                q.answer = q.choices.indexOf(correctText);
            }
        });

        // Guard: nothing to quiz on
        if (quiz.length === 0) {
            if (isBeginner) {
                alert('No beginner questions (Numbers, Colors, Capitals, Animals) are available for ' + get_selected_language() + ' yet.\nPlease try A1 level instead.');
            } else {
                alert('No questions found for the selected language and level. Try a different combination.');
            }
            return;
        }

        quiz_started = true;
        originalQuestionCount = parseInt(d3.select('#question_size').html());

        // Use name="topics" to avoid accidentally picking up level checkbox values
        const selectedTypes = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="topics"]:checked')).map(el => el.value);
        const doMultipleChoice = selectedTypes.includes('Multiple Choice') || selectedTypes.length === 0;
        const doCrossword = selectedTypes.includes('Crossword');
        const doHangman = selectedTypes.includes('Hangman');
        const doFlashcard = selectedTypes.includes('Flashcard');
        const doTyping = selectedTypes.includes('Typing');
        typingModeActive = doTyping && !doMultipleChoice;

        if (doMultipleChoice) {
            fill_qa(quiz[0]);
            selectPage('question_page');
        }
        if (doCrossword) {
            fill_crossword(quiz);
            if (!doMultipleChoice) selectPage('puzzle-piece_page');
        }
        if (doHangman) {
            // Build a shuffled pool of candidates: no spaces, at least 3 chars
            const hangmanPool = quiz
                .filter(q => q.choices[q.answer] && !q.choices[q.answer].includes(' ') && q.choices[q.answer].length >= 3)
                .sort(() => Math.random() - 0.5);

            // Prefer words whose characters are all in the language alphabet
            const alphabetLetters = (language_alphabets[get_selected_language()] || '').toLowerCase().split(' ');
            let chosen = null;
            for (const candidate of hangmanPool) {
                const word = candidate.choices[candidate.answer].toLowerCase();
                if (word.split('').every(ch => alphabetLetters.includes(ch))) {
                    chosen = candidate;
                    break;
                }
            }
            // Fall back to any candidate if none matched the alphabet perfectly
            if (!chosen && hangmanPool.length > 0) chosen = hangmanPool[0];

            if (chosen) {
                fill_hangman(chosen.choices[chosen.answer], chosen.question, chosen.extra || '');
                hangman_ready = true;
                if (!doMultipleChoice && !doCrossword) selectPage('sign-hanging_page');
            } else {
                hangman_ready = false;
                showFeedback('No suitable word found for Hangman in this quiz.', 'warning');
            }
        }

        if (doFlashcard) {
            startFlashcards(quiz);
            if (!doMultipleChoice && !doCrossword && !doHangman) selectPage('flashcard_page');
        }

    }).catch(function(err) {
    })
}

function nextQuestion() {
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    decolorCorrectAnswer();
    countViewed++;
    countQues++;
    question_index = parseInt(d3.select('#question_number').html());
    if(question_index < parseInt(d3.select('#question_size').html())) {
        d3.select('#question_number').html( question_index + 1);
        fill_qa(quiz[countQues]);  
    } else {
        d3.select('#question_number').html(1);
        viewResults();
        // d3.select('#second_page').style("display", 'none');
        // d3.select('#third_page').style("display", 'block');
    }
}

function colorCorrectAnswer() {
    for (i=1;i<=4;i++) {
        if(d3.select('#opt'+i).text() == quiz[countQues].choices[quiz[countQues].answer]) {
            d3.select('#opt'+i).style('background-color','#DCFCE7').style('color','#166534').style('border-color','#BBF7D0');
        }
    }
}

function decolorCorrectAnswer() {
    for (i=1;i<=4;i++) {
        d3.select('#opt'+i)
            .style('color', null)
            .style('background-color', null)
            .style('border-color', null)
            .property('disabled', false);
    }
}

function submitAnswer(which_option) {
    // Prevent re-answering the same question
    if (d3.select('#opt1').property('disabled')) return;

    saveAnswerStateForUndo();

    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    // Lock all options
    for (let i = 1; i <= 4; i++) {
        d3.select('#opt' + i).property('disabled', true);
    }

    const selectedAnswer = d3.select('#opt' + which_option).html();
    const correctAnswer = quiz[countQues].choices[quiz[countQues].answer];

    // Always show the correct answer in green
    colorCorrectAnswer();

    var isRequeued = !!quiz[countQues]._requeued;

    // Track vocabulary
    trackVocabWord(correctAnswer);

    if (selectedAnswer === correctAnswer) {
        if (!isRequeued) countCorrect++;
        playCorrectSound();
    } else {
        if (!isRequeued) {
            countIncorrect++;
            wrongAnswers.push({
                question: quiz[countQues].question,
                extra: quiz[countQues].extra || '',
                yourAnswer: selectedAnswer,
                correctAnswer: correctAnswer,
                _topic: quiz[countQues]._topic || 'Unknown'
            });
            // Re-queue this question 3 slots ahead for one more attempt
            var requeue = Object.assign({}, quiz[countQues], { _requeued: true });
            var insertAt = calcRequeueInsertAt(countQues, quiz.length); // pure fn from logic.js
            quiz.splice(insertAt, 0, requeue);
            d3.select('#question_size').html(parseInt(d3.select('#question_size').html()) + 1);
        }
        playWrongSound();
        // Mark the wrong pick in red
        d3.select('#opt' + which_option)
            .style('background-color', '#FEE2E2')
            .style('color', '#991B1B')
            .style('border-color', '#FECACA');
    }

    // Show undo button briefly (3 seconds)
    var undoBtn = d3.select('#undo_btn');
    undoBtn.style('display', 'inline-flex');
    setTimeout(function() { undoBtn.style('display', 'none'); lastAnswerState = null; }, 3000);

    // Save session state
    saveSessionState();
}

function viewResults() {
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    decolorCorrectAnswer();

    const total = originalQuestionCount || parseInt(d3.select('#question_size').html()) || 10;
    const { pct, skipped } = calcScore(countCorrect, countIncorrect, total); // pure fn from logic.js

    // Clear session state on completion
    sessionStorage.removeItem('goftan_session');

    // Update summary banner
    d3.select('#result_score_pct').text(pct + '%');
    d3.select('#result_language').text(get_selected_language());
    d3.select('#result_correct').text(countCorrect);
    d3.select('#result_incorrect').text(countIncorrect);
    d3.select('#result_skipped').text(skipped);
    d3.select('#result_total').text(total);

    const grade = getGradeText(pct); // pure fn from logic.js
    d3.select('#result_grade').text(grade);

    // === Personal best ===
    const lang = get_selected_language();
    const prevBest = getPersonalBestForLanguage(lang);
    const isNewBest = prevBest === null || pct > prevBest;
    const bestEl = d3.select('#result_personal_best');
    if (isNewBest && pct > 0) {
        bestEl.html('🏅 New personal best!').attr('class', 'results-best results-best-new');
    } else if (prevBest !== null) {
        bestEl.html('Personal best: ' + prevBest + '%').attr('class', 'results-best');
    } else {
        bestEl.html('');
    }

    // === Confetti on high score ===
    if (pct >= 90) launchConfetti();

    // === Streak + XP ===
    const eng = updateStreakAndXP(countCorrect, total);
    renderEngagementRow(eng);

    // === Badges ===
    const newBadges = checkAndAwardBadges(pct);
    renderBadges(newBadges);

    // === Activity heatmap ===
    recordTodayActivity(countCorrect);
    renderActivityHeatmap();

    // === Vocab estimate ===
    renderVocabEstimate(lang);

    // === Bookmarks ===
    renderBookmarks();

    // === Difficulty nudge ===
    renderDifficultyNudge(pct);

    // === Score trend ===
    const history = saveAndGetScoreHistory(lang, pct);
    renderTrendChart(history, lang);

    // Plotly chart
    const layout = {
        xaxis: { fixedrange: true },
        yaxis: { title: 'Questions', fixedrange: true, dtick: 1 },
        title: { text: get_selected_language() + ' Quiz Results', font: { size: 16 } },
        margin: { t: 40, b: 30, l: 40, r: 10 },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'inherit' }
    };

    const data = [{
        x: ['Correct', 'Incorrect', 'Skipped'],
        y: [countCorrect, countIncorrect, skipped],
        type: 'bar',
        marker: {
            color: ['#4ADE80', '#F87171', '#94A3B8'],
            line: { color: ['#16a34a', '#dc2626', '#64748b'], width: 1.5 }
        },
        text: [countCorrect, countIncorrect, skipped].map(String),
        textposition: 'outside'
    }];

    Plotly.newPlot('myPlot', data, layout, { responsive: true, displayModeBar: false });

    // if(signined) {
    //     d3.json('https://goftan.herokuapp.com/addresult', {
    //         method:"POST",
    //         body: JSON.stringify({
    //             username: document.getElementById('username').value,
    //             points: [get_selected_language(), countCorrect, countIncorrect]
    //         }),
    //         headers: {
    //             "Content-type": "application/json; charset=UTF-8",
    //             "Access-Control-Allow-Origin": "*"
    //         }
    //         })
    //         .then(json => {
    //             d3.select('#result_table').html("");
    //             d3.select('#result_table')
    //             .selectAll('tr')
    //             .data(json.points)
    //             .enter().append('tr')
    //             .html(function(d,c){
    //                 return '<td>' + (c+1) + 
    //                 '</td><td>' + d[0] + 
    //                 '</td><td>' + d[1] 
    //                 + '</td><td>' + d[2] + '</td>';
    //             });
    //             selectPage('calculator_page');
    //         });
    // } else {

        const tryNum = d3.select('#result_table').selectAll('tr').size() + 1; // 1-indexed
        const notAnswered = Math.max(0, total - countCorrect - countIncorrect);
        d3.select('#result_table').append('tr')
        .selectAll("td")
        .data([tryNum, lang, countCorrect, countIncorrect, notAnswered])
        .enter()
        .append("td").text(function(d) { return d; });
        saveSessionEntry(tryNum, lang, countCorrect, countIncorrect, notAnswered);

        // Show wrong answers review
        const review = d3.select('#wrong_answers_review').html('');
        if (wrongAnswers.length > 0) {
            review.append('h3').text('Review: Questions you got wrong');
            var revLang = lang;
            wrongAnswers.forEach(function(w) {
                const card = review.append('div').attr('class', 'wrong-answer-card');
                if (w.extra) card.append('div').attr('class', 'wa-extra').text(w.extra);
                const qrow = card.append('div').attr('class', 'wa-q-row');
                qrow.append('div').attr('class', 'wa-question').text(w.question);
                const existingBookmarks = getBookmarks(revLang);
                const isBookmarked = existingBookmarks.some(function(b) { return b.word === w.correctAnswer; });
                qrow.append('button').attr('class', 'bm-btn' + (isBookmarked ? ' bm-active' : ''))
                    .attr('title', isBookmarked ? 'Remove bookmark' : 'Bookmark this word')
                    .text(isBookmarked ? '★' : '☆')
                    .on('click', function() {
                        var added = toggleBookmark(w.correctAnswer, w.question, revLang);
                        d3.select(this).text(added ? '★' : '☆').classed('bm-active', added);
                        renderBookmarks();
                    });
                card.append('div').attr('class', 'wa-your').html('<span>Your answer:</span> ' + w.yourAnswer);
                card.append('div').attr('class', 'wa-correct').html('<span>Correct answer:</span> ' + w.correctAnswer);
            });
        }

        // === Weak topic recommendation ===
        renderRecommendation();

        // === Topic mastery ===
        const attemptedTopics = Array.from(document.querySelectorAll('.mycheckbox:checked')).map(el => el.value);
        saveTopicMastery(lang, wrongAnswers, total, attemptedTopics);

        selectPage('calculator_page');
    // }
    
}

function playAgain() {
    // Keep all settings, just reset counters and replay
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
    countQues = 0;
    wrongAnswers = [];
    originalQuestionCount = 0;
    quiz_started = false;
    hangman_ready = false;
    d3.select('#question_number').html(1);
    d3.select('#wrong_answers_review').html('');
    d3.select('#weak_topic_rec').html('');
    d3.select('#difficulty_nudge').html('');
    startQuiz();
}

function restartQuiz() {
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    // Reset all quiz state
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
    countQues = 0;
    wrongAnswers = [];
    originalQuestionCount = 0;
    quiz_started = false;
    hangman_ready = false;

    // Reset UI state
    d3.select('#question_number').html(1);
    d3.select('#result_table').html('');         // clear history rows
    d3.select('#wrong_answers_review').html(''); // clear review cards
    d3.select('#weak_topic_rec').html('');
    d3.select('#difficulty_nudge').html('');
    localStorage.removeItem('goftan_session_history');

    // Restore topic/quiz-type sections in case Beginner mode disabled them
    onBeginnerToggle();

    selectPage('tasks_page');
}

restoreTheme();

// Try to restore unfinished session before showing language page
var restored = restoreSessionState();
if (!restored) {
    selectPage('language_page');
}
loadSessionHistory();

// Apply URL params (e.g. ?lang=French&topics=Animals&count=10)
applyUrlParams();

// Keyboard shortcut: '?' opens help modal, Escape closes it
document.addEventListener('keydown', function(e) {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        toggleShortcutHelp();
    }
    if (e.key === 'Escape') {
        var modal = document.getElementById('shortcut_modal');
        if (modal) modal.style.display = 'none';
    }
});

// Keyboard shortcuts on question page
document.addEventListener('keydown', function(event) {
    const questionPage = document.getElementById('question_page');
    if (!questionPage || questionPage.style.display === 'none') return;

    const isLocked = d3.select('#opt1').property('disabled');

    if (event.key === 'Enter') {
        if (isLocked) {
            nextQuestion();
        } else {
            const focused = document.activeElement;
            const opts = ['opt1','opt2','opt3','opt4'];
            const idx = opts.indexOf(focused && focused.id);
            if (idx !== -1) submitAnswer(idx + 1);
        }
    } else if (!isLocked && ['1','2','3','4'].includes(event.key)) {
        // 1–4 keys select answer directly
        submitAnswer(parseInt(event.key));
    }
});
