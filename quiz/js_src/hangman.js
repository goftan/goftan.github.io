var selected_word = "test";
var hangman_wrong_guesses = 0;
var hangman_max_wrong = 6;
var hangman_solved = false;
var hangman_parts = ['hm-head', 'hm-body', 'hm-left-arm', 'hm-right-arm', 'hm-left-leg', 'hm-right-leg'];

function hangman_button_click(letter) {
    if (hangman_solved || hangman_wrong_guesses >= hangman_max_wrong) return;

    d3.select('#hangman_letter_' + letter).classed('hm-used', true).attr('disabled', true);

    var current = d3.select('#hangman_answer').html();
    var updated = current;
    var found = false;
    for (var i = 0; i < selected_word.length; i++) {
        if (selected_word[i] === letter.toLowerCase()) {
            updated = updated.substring(0, i) + letter.toUpperCase() + updated.substring(i + 1);
            found = true;
        }
    }
    d3.select('#hangman_answer').html(updated);

    if (!found) {
        hangman_wrong_guesses++;
        updateHangmanSVG();
        updateHangmanLives();
        playWrongSound();
        if (hangman_wrong_guesses >= hangman_max_wrong) {
            showHangmanGameOver();
        }
    } else {
        playCorrectSound();
        if (updated.indexOf('_') === -1) {
            hangman_solved = true;
            showHangmanWin();
        }
    }
}

function updateHangmanSVG() {
    for (var i = 0; i < hangman_parts.length; i++) {
        var el = document.getElementById(hangman_parts[i]);
        if (el) el.style.display = i < hangman_wrong_guesses ? '' : 'none';
    }
}

function updateHangmanLives() {
    var el = document.getElementById('hangman_lives');
    if (!el) return;
    var html = '';
    for (var i = 0; i < hangman_max_wrong; i++) {
        html += '<span class="hm-life' + (i < hangman_wrong_guesses ? ' hm-life-lost' : '') + '">&#9829;</span>';
    }
    el.innerHTML = html;
}

function showHangmanGameOver() {
    var current = d3.select('#hangman_answer').html();
    var revealed = '';
    for (var i = 0; i < selected_word.length; i++) {
        if (current[i] === '_') {
            revealed += '<span class="hm-reveal">' + selected_word[i].toUpperCase() + '</span>';
        } else {
            revealed += current[i];
        }
    }
    d3.select('#hangman_answer').html(revealed);
    d3.select('#hangman_status').html(
        '<span class="hm-gameover">Game Over! The word was: <strong>' + selected_word.toUpperCase() + '</strong></span>'
    );
    // Tint person parts dark red
    hangman_parts.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.setAttribute('stroke', '#991B1B');
    });
    d3.selectAll('.hm-letter-btn').attr('disabled', true);
}

function showHangmanWin() {
    d3.select('#hangman_status').html('<span class="hm-win">&#127881; You solved it!</span>');
    // Tint visible person parts green
    hangman_parts.forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.style.display !== 'none') el.setAttribute('stroke', '#059669');
    });
    d3.selectAll('.hm-letter-btn').attr('disabled', true);
}

function generateButton(alphabets) {
    return '<div class="hm-alphabet-grid">' +
        alphabets.split(' ').map(function(letter) {
            return '<button class="hm-letter-btn" onclick="hangman_button_click(\'' + letter + '\')" id="hangman_letter_' + letter + '">' + letter + '</button>';
        }).join('') +
        '</div>';
}

function fill_hangman(word, clue, extra) {
    selected_word = word.toLowerCase();
    hangman_wrong_guesses = 0;
    hangman_solved = false;

    // Reset SVG person parts
    hangman_parts.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.setAttribute('stroke', '#DC2626');
        }
    });
    d3.select('#hangman_status').html('');

    // Hint
    var hintHtml = (extra ? '<span class="hm-extra">' + extra + '</span> ' : '') +
                   '<span class="hm-clue">' + (clue || '') + '</span>';
    d3.select('#hangman_hint').html(hintHtml);

    // Blank dashes — one per letter, no spaces so indices align with selected_word
    d3.select('#hangman_answer').html(
        d3.range(word.length).map(function() { return '_'; }).join('')
    );

    // Alphabet buttons
    d3.select('#hangman_alphabets').html(
        generateButton(language_alphabets[get_selected_language()])
    );

    // Lives display
    updateHangmanLives();
}
