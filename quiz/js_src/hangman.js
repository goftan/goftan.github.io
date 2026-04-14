var selected_word = "test"

function hangman_button_click(letter) {
  d3.select('#hangman_letter_' + letter).classed('hm-used', true).attr('disabled', true);
  var hangman_answer = d3.select('#hangman_answer').html();
  for(var i = 0; i < hangman_answer.length; i++) {
    if(selected_word[i] == letter.toLowerCase()) {
      hangman_answer = hangman_answer.substring(0, i) + letter + hangman_answer.substring(i + 1);
    }
  }
  d3.select('#hangman_answer').html(hangman_answer);
}

// Generate grid of alphabet buttons
function generateButton(alphabets) {
    return '<div class="hm-alphabet-grid">' +
      alphabets.split(" ").map(letter =>
        `<button class="hm-letter-btn" onclick="hangman_button_click('${letter}')" id="hangman_letter_${letter}">${letter}</button>`
      ).join("") +
    '</div>';
}

function fill_hangman(word, clue, extra) {
    selected_word = word.toLowerCase();

    // Show hint
    const hintHtml = (extra ? `<span class="hm-extra">${extra}</span> ` : '') +
                     `<span class="hm-clue">${clue || ''}</span>`;
    d3.select('#hangman_hint').html(hintHtml);

    // Show blank dashes — no spaces so indices align with selected_word
    d3.select('#hangman_answer').html(
        d3.range(word.length).map(() => '_').join('')
    );

    // Render alphabet buttons
    d3.select('#hangman_alphabets').html(
        generateButton(language_alphabets[get_selected_language()])
    );
}
