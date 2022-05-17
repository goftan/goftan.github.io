// firebase.auth().onAuthStateChanged(function(user) {
//   if (user) {
//     // User is signed in.
//   } else {
//     // No user is signed in.
//   }
// });

var questionSentence = {
    "antonym" : "Antonym of",
    "translate_en_fa": "Translation of",
    "translate_fa_en": "Translation of",
    "synonym": "Synonym of",
    "sentence": "Fill in the blank"
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

var countQues=0;
var lang;
var score=0;
var correct = 0;
var incorrect = 0;

document.getElementById("score").textContent="Score : "+0;
document.querySelector(".view-results").style.display="none";
document.querySelector(".quiz").style.display="none";
document.querySelector(".final-result").style.display="none";


// if(localStorage.getItem("countQues") != null){
//     countQues = parseInt(localStorage.getItem("countQues"));
// }
document.querySelector(".choose-lang").addEventListener("click",function(){

    lang=document.getElementById("language").value+"Questions";

    shuffleArray(window[lang]);

    document.getElementById("ques-left").textContent="Question : "+(countQues+1)+"/"+window[lang].length;

//    alert(window[lang].length);
    //window["anything"] will convert "anything" string to object because window is also an object
    document.querySelector(".quiz").style.display="block";

        document.querySelector(".question").innerHTML= "<h2>" + questionSentence[window[lang][countQues].type] + "<h2> <br/>" +
        "<h1>"+window[lang][countQues].question+"</h1>";

     for (var i=0;i<=3;i++){                     
        document.getElementById("opt"+i).value=window[lang][countQues].choices[i];
        document.getElementById("lb"+i).innerHTML=window[lang][countQues].choices[i];
        
    };/*For loop Closed*/
    
//    window.location.href="#score";

});

document.querySelector(".view-results").style.display="unset";


document.querySelector(".submit-answer").addEventListener("click",function(){
    document.querySelector(".next-question").style.display=null;

    document.querySelectorAll('input[name="options"]').forEach(function(e){
        if(e.value === window[lang][countQues].choices[window[lang][countQues].answer]) {
            e.parentNode.style.color = 'green';
        }
    });
    if(document.querySelector('input[name="options"]:checked').value===window[lang][countQues].choices[window[lang][countQues].answer]){
        
        score+=10;
        document.getElementById("score").textContent="Score : "+score;
        correct++;
        // document.getElementById("ques-view").innerHTML+="<div class='ques-circle correct'>"+(countQues+1)+"</div>";
           
    }else{
        document.querySelector('input[name="options"]:checked').parentNode.style.color = 'red';
        score-=5;
        document.getElementById("score").textContent="Score : "+score;
        incorrect++;
        // document.getElementById("ques-view").innerHTML+="<div class='ques-circle incorrect'>"+(countQues+1)+"</div>";
    };
    
    if (countQues<window[lang].length-1){
        countQues++;
        // localStorage.setItem("countQues",countQues);
    }else{
        document.querySelector(".submit-answer").style.display="none";
        // document.querySelector(".view-results").style.display="unset";

    }

});

document.querySelector(".next-question").addEventListener("click",function(){
    document.querySelector(".next-question").style.display="none";
    document.querySelectorAll('input[name="options"]').forEach(function(e){
            e.parentNode.style.color = 'black';
        
    });

document.getElementById("ques-left").textContent="Question : "+(countQues+1)+"/"+window[lang].length;

    document.querySelector(".question").innerHTML= "<h2>" + questionSentence[window[lang][countQues].type] + "<h2> <br/>" +
    "<h1 direction=rtl>"+window[lang][countQues].question+"</h1>";
    
    for (i=0;i<=3;i++){                     
        document.getElementById("opt"+i).value=window[lang][countQues].choices[i];
        document.getElementById("lb"+i).innerHTML=window[lang][countQues].choices[i];
    
    };/*For loop Closed*/
});

document.querySelector(".view-results").addEventListener("click",function(){
    countQues
    document.querySelector(".final-result").style.display="block";
    
    all = correct + incorrect;
    document.querySelector(".solved-ques-no").innerHTML="You Solved " + all
        + " questions of "+document.getElementById("language").value;
    
    // var correct= document.getElementById("ques-view").getElementsByClassName("correct").length;
    
    document.querySelector(".right-wrong").innerHTML=correct+" were Right and "+incorrect+" were Wrong";
    
    document.getElementById("display-final-score").innerHTML="Your Final Score is: "+score;
    
    if (correct/(countQues+1)>0.8){
        document.querySelector(".remark").innerHTML="Remark: OutStanding ! :)";
    }else if(correct/(countQues+1)>0.6){
        document.querySelector(".remark").innerHTML="Remark: Good, Keep Improving.";
    
    }else if(correct/incorrect > 0.4) {
        document.querySelector(".remark").innerHTML="Remark: Satisfactory, Learn More.";
    }else{
        document.querySelector(".remark").innerHTML="Remark: Unsatisfactory, Try Again.";
    }
    
//    window.location.href="#display-final-score";

});

document.getElementById("restart").addEventListener("click",function(){
    location.reload();

});

document.getElementById("about").addEventListener("click",function(){
    // alert("Quiz Website Project Created By Digvijay Singh");

});


/*Smooth Scroll*/


$(document).on('click', 'a[href^="#"]', function (event) {
    event.preventDefault();

    $('html, body').animate({
        scrollTop: $($.attr(this, 'href')).offset().top
    }, 1000);
});



/*Smooth Scroll End*/
