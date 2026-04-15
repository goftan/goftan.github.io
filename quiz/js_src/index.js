var avialable_languages = [
    'Persian',
    'German',
    'Spanish',
    'Korean',
    'Turkish',
    'Arabic',
    'Portuguese'
]

var available_programming_languages = [
    'Rust',
    'CPP'
]

var language_alphabets = {
    'Persian': 'ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی',
    'German': 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Ä Ö Ü ß',
    'Spanish': 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z',
    'Korean': 'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
    'Turkish': 'A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z',
    'Arabic': 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي',
    'Portuguese': 'A B C D E F G H I J L M N O P Q R S T U V X Z'
};

var available_quiz_types = [
    'Crossword',
    'Multiple Choice',
    'Hangman'
];

var avialble_topics = [
    'Capitals',
    'Numbers',
    'Colors',
    'Animals',
    'Antonyms',
    'Common Words', 
    'Common Sentences'
];

quiz_started = false;
var hangman_ready = false;

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
    var raw = localStorage.getItem('goftan_engagement');
    var data = raw ? JSON.parse(raw) : {};
    var yesterday = new Date(Date.now() - 86400000).toDateString();

    if (data.lastPlayed === today) {
        // already played today — streak unchanged
    } else if (data.lastPlayed === yesterday) {
        data.streak = (data.streak || 1) + 1;
    } else {
        data.streak = 1;
    }
    data.lastPlayed = today;

    var streakBonus = data.streak > 1 ? 50 : 0;
    var earnedXP = correct * 10 + streakBonus;
    data.xp = (data.xp || 0) + earnedXP;
    localStorage.setItem('goftan_engagement', JSON.stringify(data));
    return { streak: data.streak, xp: data.xp, earnedXP: earnedXP, streakBonus: streakBonus };
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
    var history = stored ? JSON.parse(stored) : [];
    history.push(pct);
    if (history.length > 20) history.splice(0, history.length - 20);
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
    if (wrongAnswers.length === 0) return;

    var counts = {};
    wrongAnswers.forEach(function(w) {
        var t = w._topic || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
    });
    var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    var top = sorted[0];
    if (!top || top[0] === 'Unknown') return;

    var topicName = top[0];
    var missCount = top[1];

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
function getPersonalBest(language) {
    var stored = localStorage.getItem('goftan_scores_' + language.toLowerCase());
    if (!stored) return null;
    var h = JSON.parse(stored);
    return h.length ? Math.max.apply(null, h) : null;
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
    if (pct < 85) return;
    var levelOrder = ['Beginner', 'A1', 'A2', 'B1', 'B2'];
    var selected = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked'))
                        .map(function(el) { return el.value; });
    var highestIdx = -1;
    selected.forEach(function(l) {
        var idx = levelOrder.indexOf(l);
        if (idx > highestIdx) highestIdx = idx;
    });
    if (highestIdx < 0 || highestIdx >= levelOrder.length - 1) return;
    var nextLevel = levelOrder[highestIdx + 1];
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
    d3.select('#language_checkboxes').selectAll('label').data(avialable_languages)
        .enter().append('label').attr('class','radiocontainer')
        .html(function(d){return '<input type="radio" name="topics" value="'+d+'" class="languages_checkbox">'
                                    + d +'<span class="radiocheckmark"></span>';});

    // Highlight the selected language card
    d3.selectAll('.languages_checkbox').on('change', function() {
        d3.selectAll('.radiocontainer').classed('language-selected', false);
        if (this.checked) {
            d3.select(this.parentNode).classed('language-selected', true);
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
    container.selectAll('label').data(avialble_topics)
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function fill_qa(q) {
    d3.select("#extra").html(q._requeued ? '🔄 Try again' : (q.extra || ''));
    d3.select("#question").html(q.question);
    for (i=0;i<=3;i++) {
        d3.select('#opt'+ (i + 1)).html(q.choices[i]);
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
            var insertAt = Math.min(countQues + 3, quiz.length);
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
}

function viewResults() {
    clearQuestionTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    decolorCorrectAnswer();

    const total = originalQuestionCount || parseInt(d3.select('#question_size').html()) || 10;
    const skipped = Math.max(0, total - countCorrect - countIncorrect);
    const pct = Math.round((countCorrect / total) * 100);

    // Update summary banner
    d3.select('#result_score_pct').text(pct + '%');
    d3.select('#result_language').text(get_selected_language());
    d3.select('#result_correct').text(countCorrect);
    d3.select('#result_incorrect').text(countIncorrect);
    d3.select('#result_skipped').text(skipped);
    d3.select('#result_total').text(total);

    const grade = pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '👍 Good job!' : pct >= 50 ? '📚 Keep practicing!' : '💪 Don\'t give up!';
    d3.select('#result_grade').text(grade);

    // === Personal best ===
    const lang = get_selected_language();
    const prevBest = getPersonalBest(lang);
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
            wrongAnswers.forEach(function(w) {
                const card = review.append('div').attr('class', 'wrong-answer-card');
                if (w.extra) card.append('div').attr('class', 'wa-extra').text(w.extra);
                card.append('div').attr('class', 'wa-question').text(w.question);
                card.append('div').attr('class', 'wa-your').html('<span>Your answer:</span> ' + w.yourAnswer);
                card.append('div').attr('class', 'wa-correct').html('<span>Correct answer:</span> ' + w.correctAnswer);
            });
        }

        // === Weak topic recommendation ===
        renderRecommendation();

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

selectPage('language_page');
loadSessionHistory();

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
