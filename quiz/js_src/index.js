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


init_nav_menu();

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
    selectPage('tasks_page');
    if(d3.select('.myradiobox:checked').size() == 0) {
        alert('Please select a language');
        return;
    }
    var lang = d3.select('.myradiobox:checked').node().value;
    localStorage.setItem('lang',lang);
    fill_topic_checkboxes();
}

function startLearningWithKnownLanguage() {
    selectPage('tasks_page');
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
        selectPage('question_page');

        fill_crossword(quiz);
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
    selectPage('calculator_page');
    d3.select('#result_table').append('tr').selectAll("td")
                .data([d3.select('table').selectAll('tr').size()  - 1, 
                countCorrect, countIncorrect])
                .enter()
                .append("td").text(function(d) { return d; });
}

function restartQuiz() {
    selectPage('tasks_page');
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
}


// table, th, td {
    // border: 1px solid black;
    // border-collapse: collapse;
//   }

arr1 = []
for(i = 0;i < 12 ;i++) {
    arr1.push(i)
}

arr2 = []
for(i = 0;i < 13 ;i++) {
    arr2.push(i);
}

function fill_crossword(quiz) {
    var input = [];
    console.log('here')
    for(q of quiz.slice(0,100)) {
        console.log(q);
        if(q.type === 'translate_fa_en')
            input.push({'answer': q.choices[q.answer], 'clue': q.question});
    }
    console.log(input);
    var layout = generateLayout(input);
    var rows = layout.rows;
    var cols = layout.cols;
    var table = layout.table; // table as two-dimensional array
    var output_html = layout.table_string; // table as plain text (with HTML line breaks)
    var output_json = layout.result; // words along with orientation, position, startx, and starty
    for(var i=0;i<rows;i++) {
        d3.select('#crossword').append('tr').selectAll("td")
        .data(table[i])
        .enter()
        .append("td")
        .style('border', function(d,c){
            if(d == '-') return ""; 
            return '1px solid black';})
        .style('border-collapse', 'collapse')
        .style('width', '20px')
        .style('height', '20px')
        .style('text-align','center')
        .style('font-size','9px')
        // .style('background-color', function(d,c){
        //     if(d=='-')
        //         return "black"; 
        //     return 'white';
        // })
        .html(function(d,c) { 
            if(d=='-')return ""; 
            else return "<input class='crossword_cells' id='crossword_cells'>"; 
        });
    }
    console.log(table);
    console.log(output_html);
    console.log(rows);
    console.log(output_json)
}

// cnt = 0;
// arr1.forEach(function(e){
//     if(cnt == 0) 
//         d3.select('#crossword').append('tr').selectAll("td")
//         .data(arr2)
//         .enter()
//         .append("td")
//         // .style('border', '1px solid black')
//         // .style('border-collapse', 'collapse')
//         .style('width', '20px')
//         .style('height', '20px')
//         .style('text-align','center')
//         .style('font-size','9px')
//         .text(function(d,c) { if(c==0)return ""; return ""+c; });

//     td = d3.select('#crossword').append('tr').selectAll("td")
//     .data(arr2)
//     .enter()
//     .append("td")
//     .style('border', function(e,c){if(c == 0) return ""; return '1px solid black';})
//     .style('border-collapse', 'collapse')
//     .style('width', '15px')
//     .style('font-size','9px')
//     .style('height', '15px')
//     .style('text-align','center')
//     .html(function(d,c) { 
//         if(c==0) return  (cnt+1)+"";
//         return "<input class='crossword_cells' id='crossword_cells'>"; 
//     });
//     d3.selectAll('input.crossword_cells').on('input', function() {
//         if(this.value.length > 1) {
//             this.value = this.value.slice(0,1);
//         }
//         return this.value;
//     });
//     cnt++;
// });

function checkinput(e) {
    console.log(this.value)
    value = document.getElementById('myInput').value;
    if(value.length > 1) 
    document.getElementById('myInput').value = this.value.slice(0, 1);
  }