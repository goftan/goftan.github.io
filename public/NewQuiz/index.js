var avialable_languages = [
    'Persian',
    //'English',
    'Spanish',
    'Korean'
]

var avialble_topics = [
    'Capitals',
    'Numbers',
    'Colors',
    // 'Animals',
    'Antonyms',
    'Common Words', 
    'Common Sentences'];

function deselectAllNav() {
    d3.select('#language_page_nav').attr('class','inactive');
    d3.select("#topics_page_nav").attr('class','inactive');
    d3.select("#quiz_page_nav").attr('class','inactive');
    d3.select("#results_page_nav").attr('class','inactive');
    d3.select('#about_page_nav').attr('class','inactive');

    d3.select('#language_page').style("display", 'none');
    d3.select('#topics_page').style("display", 'none');
    d3.select('#quiz_page').style("display", 'none');
    d3.select('#results_page').style("display", 'none');
    d3.select('#about_page').style("display", 'none');
}

function selectPage(page) {
    deselectAllNav();
    d3.select('#'+page+"_nav").attr('class','active');
    d3.select('#'+page).style("display", 'block');
}

function fill_language_checkboxes() {
    d3.select('#language_checkboxes').selectAll('label').data(avialable_languages)
        .enter().append('label').text(function(d){return d;}).attr('class','radiocontainer')
        .html(function(d){return '<input type="radio" name="topics" value="'+d+'" class="myradiobox">'
                                    + d +'<span class="radiocheckmark"></span>';});
}

fill_language_checkboxes();
if(localStorage.getItem('lang') != null) {
    startLearningWithKnownLanguage();
}

function startLearning() {
    selectPage('topics_page');
    if(d3.select('.myradiobox:checked').size() == 0) {
        alert('Please select a language');
        return;
    }
    var lang = d3.select('.myradiobox:checked').node().value;
    localStorage.setItem('lang',lang);
    fill_topic_checkboxes();
}

function startLearningWithKnownLanguage() {
    selectPage('topics_page');
    fill_topic_checkboxes();
}

function fill_topic_checkboxes() {
    d3.select('#topics_checkboxes').selectAll('label').data(avialble_topics)
        .enter().append('label').text(function(d){return d;}).attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="' + d +'" checked="checked" class="mycheckbox">'
                                  + d +'<span class="checkmark"></span>';});
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
        d3.select('#opt'+i).text(q.choices[i]);
    }  
}

var countQues=0;
var quiz = [];
var countCorrect = 0;
var countIncorrect = 0;
var countViewed = 0;

function startQuiz() {
    let readers = [];
    var lang = localStorage.getItem('lang');
    d3.selectAll('.mycheckbox:checked').each(function() {
        var topic_name = d3.select(this).node().value.replaceAll(' ','') + '.json';
        readers.push(d3.json(lang + '/' + topic_name));
    });

    Promise.allSettled(readers).then(function(files) {
        quizall = [];
        all = [].concat.apply([], files);
        for(a of all) quizall.push(a.value);
        quiz = [].concat.apply([], quizall);
        shuffleArray(quiz);
        fill_qa(quiz[0]);
        selectPage('quiz_page');
    }).catch(function(err) {
        // handle error here
    })
}

function nextQuestion() {
    
    for (i=0;i<=3;i++) {
        d3.select('#opt'+i).style('color','black');
    }
    countViewed++;
    countQues++;
    if(countQues < quiz.length) {
        fill_qa(quiz[countQues]);  
    } else {
        // d3.select('#second_page').style("display", 'none');
        // d3.select('#third_page').style("display", 'block');
    }
}

function colorCorrectAnswer() {
    for (i=0;i<=3;i++) {
        if(d3.select('#opt'+i).text() == quiz[countQues].choices[quiz[countQues].answer]) {
            d3.select('#opt'+i).style('color','green');
        }
    }
}

function decolorCorrectAnswer() {
    for (i=0;i<=3;i++) {
            d3.select('#opt'+i).style('color','black');
    }
}

function submitAnswer() {
    decolorCorrectAnswer();    
    var selectedAnswer = d3.select('input[name="radio"]:checked').node().previousElementSibling.textContent;
    colorCorrectAnswer();    

    if(selectedAnswer == quiz[countQues].choices[quiz[countQues].answer]) {
        countCorrect++;
    } else {
        countIncorrect++;
        d3.select(d3.select('input[name="radio"]:checked').node().previousElementSibling).style('color','red')
    }
}

function viewResults() {
    decolorCorrectAnswer(); 
    selectPage('results_page');
    d3.select('#result_table').append('tr').selectAll("td")
                .data([d3.select('table').selectAll('tr').size()  - 1, 
                countCorrect, countIncorrect])
                .enter()
                .append("td").text(function(d) { return d; });
}

function restartQuiz() {
    selectPage('topics_page');
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
}


function click_nav(nav_name) {
    selectPage(nav_name);
}


// table, th, td {
    // border: 1px solid black;
    // border-collapse: collapse;
//   }

[...Array(15).keys()].forEach(function(e){
    d3.select('#crossword').append('tr').selectAll("td")
    .data([...Array(15).keys()])
    .enter()
    .append("td")
    .style('border', '1px solid black')
    .style('border-collapse', 'collapse')
    .style('width', '20px')
    .style('height', '20px')
    .style('text-align','center')
    .text(function(d) { return "a"; });
});
