var selected_word = "test"

function hangman_button_click(letter) {
  d3.select('#'+letter).style('color','red').attr('disabled',true);
  var hangman_answer = d3.select('#hangman_answer').html();
  console.log(letter + " , " + hangman_answer + " , " + selected_word)
  for(var i=0;i<hangman_answer.length;i++) {
    if(selected_word[i] == letter.toLowerCase()) {
      hangman_answer = hangman_answer.substring(0,i) + letter + hangman_answer.substring(i+1);
    }
  }

  d3.select('#hangman_answer').html(hangman_answer);
}


//generate alphabet button
function generateButton(alphabets) {
    var buttonsHTML = alphabets
      .split(" ")
      .map(
        (letter) =>
          `<button
           class = "button button5" 
           onclick="hangman_button_click('${letter}')"
           id="${letter}"
           >
          ${letter}
          </button>`
      )
      .join("");
  
    return buttonsHTML;
}

function fill_hangman(word) {
    selected_word = word.toLowerCase();
    d3.select('#hangman_alphabets').html(generateButton(language_alphabets[get_selected_language()]));
    d3.select('#hangman_answer').html(d3.range(word.length).map(i => "-").join(""));
}