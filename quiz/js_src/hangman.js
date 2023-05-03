//generate alphabet button
function generateButton(alphabets) {
    var buttonsHTML = alphabets
      .split(" ")
      .map(
        (letter) =>
          `<button
           class = "button button5" 
           id="${letter}"
           >
          ${letter}
          </button>`
      )
      .join("");
  
    return buttonsHTML;
}

function fill_hangman() {
    d3.select('#hangman_alphabets').html(generateButton(language_alphabets[get_selected_language()]));
    d3.select('#hangman_answer').html(d3.range(10).map(i => "-").join(""));
}