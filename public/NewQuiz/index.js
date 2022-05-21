var avialble_topics = [
    'Capitals',
    'Numbers',
    'Colors',
    // 'Animals',
    'Antonyms',
    'Common Words', 
    'Common Sentences'];

function fill_topic_checkboxes() {
    d3.select('#topics_checkboxes').selectAll('label').data(avialble_topics)
        .enter().append('label').text(function(d){return d;}).attr('class','container')
        .html(function(d){return '<input type="checkbox" name="topics" value="'+d+'" checked="checked" class="mycheckbox">'
                                  + d +'<span class="checkmark"></span>';});
}


fill_topic_checkboxes();

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
    d3.selectAll('.mycheckbox:checked').each(function() {
        var topic_name = d3.select(this).node().value.replaceAll(' ','') + '.json';
        console.log(topic_name);
        readers.push(d3.json(topic_name));
    });

    Promise.allSettled(readers).then(function(files) {
        quizall = [];
        all = [].concat.apply([], files);
        for(a of all) quizall.push(a.value);
        quiz = [].concat.apply([], quizall);
        console.log(quiz);
        shuffleArray(quiz);
        fill_qa(quiz[0]);
        d3.select('#first_page').style("display", 'none');
        d3.select('#second_page').style("display", 'block');
        d3.select("#topics_").attr('class','inactive');
        d3.select("#quiz_").attr('class','active');
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
    d3.select('#first_page').style("display", 'none');
    d3.select('#second_page').style("display", 'none');
    d3.select('#third_page').style("display", 'block');
    d3.select("#topics_").attr('class','inactive');
    d3.select("#quiz_").attr('class','inactive');
    d3.select("#results_").attr('class','active');
    // d3.select("#correct").text(countCorrect);
    // d3.select('#incorrect').text(countIncorrect);
    d3.select('table').append('tr').selectAll("td")
                .data([d3.select('table').selectAll('tr').size()  - 1, 
                countCorrect, countIncorrect, countViewed - countCorrect - countIncorrect])
                .enter()
                .append("td").text(function(d) { return d; });
}

function restartQuiz() {
    d3.select('#first_page').style("display", 'block');
    d3.select('#second_page').style("display", 'none');
    d3.select('#third_page').style("display", 'none');
    d3.select("#topics_").attr('class','active');
    d3.select("#quiz_").attr('class','inactive');
    d3.select("#results_").attr('class','inactive');
    countCorrect = 0;
    countIncorrect = 0;
    countViewed = 0;
}