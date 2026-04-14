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
    const settings = {
        language: is_language_selected() ? get_selected_language() : null,
        numQuestions: document.getElementById('num_of_questions').value,
        levels: Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked')).map(el => el.value),
        quizTypes: Array.from(document.querySelectorAll('.mycheckboxqtypes[name="topics"]:checked')).map(el => el.value),
        topics: Array.from(document.querySelectorAll('.mycheckbox:checked')).map(el => el.value),
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
        // Quiz types, levels and topics are rendered later (fill_quiz_type_checkboxes / fill_topic_checkboxes)
        // Store them for use after those elements exist
        window._pendingLevels = s.levels || null;
        window._pendingQuizTypes = s.quizTypes || null;
        window._pendingTopics = s.topics || null;
    } catch(e) {}
}

function applyPendingCheckboxSettings() {
    if (window._pendingLevels) {
        document.querySelectorAll('.mycheckboxqtypes[name="levels"]').forEach(el => {
            el.checked = window._pendingLevels.includes(el.value);
        });
    }
    if (window._pendingQuizTypes) {
        document.querySelectorAll('.mycheckboxqtypes[name="topics"]').forEach(el => {
            el.checked = window._pendingQuizTypes.includes(el.value);
        });
    }
    if (window._pendingTopics) {
        document.querySelectorAll('.mycheckbox').forEach(el => {
            el.checked = window._pendingTopics.includes(el.value);
        });
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function fill_qa(q) {
    d3.select("#extra").html(q.extra);
    d3.select("#question").html(q.question);
    for (i=0;i<=3;i++) {
        d3.select('#opt'+ (i + 1)).html(q.choices[i]);
    }  
}

var countQues=0;
var quiz = [];
var countCorrect = 0;
var countIncorrect = 0;
var countViewed = 0;
var wrongAnswers = [];

function startQuiz() {
    saveSettings();
    d3.select('#question_size').html(parseInt(d3.select("#num_of_questions").node().value));
    let readers = [];

    d3.selectAll('.mycheckbox:checked').each(function() {
        var topic_name = d3.select(this).node().value.replaceAll(' ','') + '.json';
        readers.push(d3.json(get_selected_language() + '/' + topic_name));
    });

    const selectedLevels = Array.from(document.querySelectorAll('.mycheckboxqtypes[name="levels"]:checked')).map(el => el.value);

    Promise.allSettled(readers).then(function(files) {
        console.log(files);
        quizall = [];
        all = [].concat.apply([], files);
        for(a of all) quizall.push(a.value);
        quizall = quizall.filter(x => x !== undefined)
        quiz = [].concat.apply([], quizall);

        // Filter by selected levels; questions without a level field are always included
        if (selectedLevels.length > 0) {
            quiz = quiz.filter(q => !q.level || selectedLevels.includes(q.level));
        }

        shuffleArray(quiz);
        quiz_started = true;

        // Determine selected quiz types
        const selectedTypes = Array.from(document.querySelectorAll('.mycheckboxqtypes:checked')).map(el => el.value);
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
            // Pick a word from the quiz answers that matches the language alphabet
            const hangmanWord = quiz.find(q => q.choices[q.answer] && !q.choices[q.answer].includes(' '));
            if (hangmanWord) {
                fill_hangman(hangmanWord.choices[hangmanWord.answer]);
            }
            if (!doMultipleChoice && !doCrossword) selectPage('sign-hanging_page');
        }

    }).catch(function(err) {
    })
}

function nextQuestion() {
    decolorCorrectAnswer();
    countViewed++;
    countQues++;
    question_index = parseInt(d3.select('#question_number').html());
    if(question_index < parseInt(d3.select("#num_of_questions").node().value)) {
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

    // Lock all options
    for (let i = 1; i <= 4; i++) {
        d3.select('#opt' + i).property('disabled', true);
    }

    const selectedAnswer = d3.select('#opt' + which_option).html();
    const correctAnswer = quiz[countQues].choices[quiz[countQues].answer];

    // Always show the correct answer in green
    colorCorrectAnswer();

    if (selectedAnswer === correctAnswer) {
        countCorrect++;
    } else {
        countIncorrect++;
        wrongAnswers.push({
            question: quiz[countQues].question,
            extra: quiz[countQues].extra || '',
            yourAnswer: selectedAnswer,
            correctAnswer: correctAnswer
        });
        // Mark the wrong pick in red
        d3.select('#opt' + which_option)
            .style('background-color', '#FEE2E2')
            .style('color', '#991B1B')
            .style('border-color', '#FECACA');
    }
}

function viewResults() {
    decolorCorrectAnswer();

    const total = parseInt(d3.select('#question_size').html()) || 10;
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
        .data([tryNum, get_selected_language(), countCorrect, countIncorrect, notAnswered])
        .enter()
        .append("td").text(function(d) { return d; });

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

        selectPage('calculator_page');
    // }
    
}

function playAgain() {
    // Keep all settings, just reset counters and replay
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
    countQues = 0;
    wrongAnswers = [];
    quiz_started = false;
    d3.select('#question_number').html(1);
    d3.select('#wrong_answers_review').html('');
    startQuiz();
}

function restartQuiz() {
    // Reset all quiz state
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
    countQues = 0;
    wrongAnswers = [];
    quiz_started = false;

    // Reset UI state
    d3.select('#question_number').html(1);
    d3.select('#result_table').html('');         // clear history rows
    d3.select('#wrong_answers_review').html(''); // clear review cards

    selectPage('tasks_page');
}

selectPage('language_page');

// Enter key: submit selected answer, or advance to next question
document.addEventListener('keydown', function(event) {
    if (event.key !== 'Enter') return;
    const questionPage = document.getElementById('question_page');
    if (!questionPage || questionPage.style.display === 'none') return;

    const isLocked = d3.select('#opt1').property('disabled');
    if (isLocked) {
        // Answer already submitted — advance
        nextQuestion();
    } else {
        // Find the focused option button and submit it
        const focused = document.activeElement;
        const opts = ['opt1','opt2','opt3','opt4'];
        const idx = opts.indexOf(focused && focused.id);
        if (idx !== -1) {
            submitAnswer(idx + 1);
        }
    }
});
