var avialable_languages = [
    'Persian',
    'German',
    'Spanish',
    'Korean',
    'Turkish',
    'Arabic',
    'Portuguese',
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
    'Multiple Choice'
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
        .enter().append('label').text(function(d){return d;}).attr('class','radiocontainer')
        .html(function(d){return '<input type="radio" name="topics" value="'+d+'" class="languages_checkbox">'
                                    + d +'<span class="radiocheckmark"></span>';});
}

function fill_quiz_type_checkboxes() {
        d3.select('#quiz_type_checkboxes').selectAll('label').data(available_quiz_types)
        .enter().append('label').text(function(d){return d;}).attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="' + d +'" checked="checked" class="mycheckboxqtypes">'
                                    + d +'<span class="checkmark"></span>';});
}

fill_language_checkboxes();
fill_quiz_type_checkboxes();
// if(localStorage.getItem('lang') != null) {
//     startLearningWithKnownLanguage();
// }

// function startLearningWithKnownLanguage() {
//     selectPage('tasks_page');
//     d3.select('#known_language').text('Enjoy learning ' + localStorage.getItem('lang') );
//     fill_topic_checkboxes();
// }

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
        d3.select('#opt'+ (i + 1)).html(q.choices[i]);
    }  
}

var countQues=0;
var quiz = [];
var countCorrect = 0;
var countIncorrect = 0;
var countViewed = 0;

function startQuiz() {
    d3.select('#question_size').html(parseInt(d3.select("#num_of_questions").node().value));
    let readers = [];

    d3.selectAll('.mycheckbox:checked').each(function() {
        var topic_name = d3.select(this).node().value.replaceAll(' ','') + '.json';
        readers.push(d3.json(get_selected_language() + '/' + topic_name));
    });

    Promise.allSettled(readers).then(function(files) {
        console.log(files);
        quizall = [];
        all = [].concat.apply([], files);
        for(a of all) quizall.push(a.value);
        quizall = quizall.filter(x => x !== undefined)
        quiz = [].concat.apply([], quizall);
        shuffleArray(quiz);
        fill_qa(quiz[0]);
        quiz_started = true;
        // fill_hangman(quiz[0]['choices'][0]);
        selectPage('question_page');
        fill_crossword(quiz);
        
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
            d3.select('#opt'+i).style('color','green');
        }
    }
}

function decolorCorrectAnswer() {
    for (i=1;i<=4;i++) {
            d3.select('#opt'+i).style('color','black');
    }
}

function submitAnswer(which_option) {
    decolorCorrectAnswer();    
    var selectedAnswer = d3.select("#opt"+which_option).html();
    colorCorrectAnswer();    

    if(selectedAnswer == quiz[countQues].choices[quiz[countQues].answer]) {
        countCorrect++;
    } else {
        countIncorrect++;
        d3.select("#opt"+which_option).style("color","red");
    }
}

function viewResults() {
    decolorCorrectAnswer(); 

    // Define Layout
    const layout = {
      xaxis: {title: "Try", tick0: 0, autotick: false},
      yaxis: {title: "Correct Answers", tick0: 0,autotick: false },  
      title: "Learning Progress"
    };

    // Define Data
    var German = {
        x: [1, 2, 3, 4],
        y: [3, 3, 4, 5],
        type: 'bar',
        name: 'German'
      };
      
      
      var Spanish = {
        x: [1, 2, 3, 4],
        y: [2, 2, 5, 7],
        type: 'bar',
        name: 'Spanish'
      };
      
      
      var data = [German, Spanish];
    
    // Display using Plotly
    Plotly.newPlot("myPlot", data, layout, color='category',{responsive: true});

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

        d3.select('#result_table').append('tr')
        .selectAll("td")
        .data([d3.select('#result_table').selectAll('tr').size(),  
        get_selected_language(), countCorrect, countIncorrect, 10 - countCorrect - countIncorrect])
        .enter()
        .append("td").text(function(d) { return d; });
        selectPage('calculator_page');
    // }
    
}

function restartQuiz() {
    selectPage('tasks_page');
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
}

selectPage('language_page');
