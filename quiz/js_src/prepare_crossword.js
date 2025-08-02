var xy_to_data = {};
// function find_suitable_neighbour_for_focus(x,y) {
//     var neighbours = [
//         {'x': x + 1, 'y': y},
//         {'x': x, 'y': y + 1},
//         {'x': x, 'y': y - 1},
//         {'x': x - 1, 'y': y},
//     ];
//     for(n of neighbours) {
//         var mynode = d3.select(id_of_cell(n.x, n.y)).node();
//         if(mynode != null && mynode.value == '') {
//             mynode.focus();
//             return;
//         }
//     }
// }

var lastActiveCell = null;

function check_if_answer(x,y) {
    d = xy_to_data[(x+1)+'_'+(y+1)]
    startx = d.startx;
    starty = d.starty;
    if(direction == 'across') {
        for(var counter = 0; counter < d.answer.length;counter++) {
            if(d3.select('#' + id_of_cell_alone(startx + counter-1, starty-1)).node().value != d.answer[counter]) {
                return false;
            }
        }
        for(var counter = 0; counter < d.answer.length;counter++) {
            d3.select('#' + id_of_cell_alone(startx + counter-1, starty-1)).style('background-color','lightgreen');
            d3.select('#' + id_of_cell_alone(startx + counter-1, starty-1)).node().setAttribute('disabled','')
        }
    } else {
        for(var counter = 0; counter < d.answer.length;counter++) {
            if(d3.select('#' + id_of_cell_alone(startx - 1, starty + counter - 1)).node().value != d.answer[counter]) {
                return false;
            }
        }
        for(var counter = 0; counter < d.answer.length;counter++) {
            d3.select('#' + id_of_cell_alone(startx -1, starty + counter -1)).style('background-color','lightgreen');
            d3.select('#' + id_of_cell_alone(startx -1, starty + counter -1)).node().setAttribute('disabled','')
        }
    }

}

direction = 'across';
function find_suitable_neighbour_for_focus(x,y) {
    if(direction == 'across') {
        var mynode = d3.select(id_of_cell(x + 1 , y)).node();
        if(mynode != null && mynode.value == '') {
            mynode.focus();
            return;
        } else {
            mynode = d3.select(id_of_cell(x - 1 , y)).node();
            if(mynode != null && mynode.value == '') {
                mynode.focus();
                return;
            }
        }
    } else {
        var mynode = d3.select(id_of_cell(x , y + 1)).node();
        if(mynode != null && mynode.value == '') {
            mynode.focus();
            return;
        } else {
            mynode = d3.select(id_of_cell(x , y - 1)).node();
            if(mynode != null && mynode.value == '') {
                mynode.focus();
                return;
            }
        }
    }
}

function get_id_from_str(id_str) {
    var tmp = id_str.split('__')[1];
    var x = parseInt(tmp.split('_')[0]);
    var y = parseInt(tmp.split('_')[1]);
    return [x,y]
}

function id_of_cell_alone(x,y) {
    return 'crossword_cells__' + x + '_' + y;
}

function id_of_cell(x,y) {
    return '#' + id_of_cell_alone(x,y);
}

function all_cross_cells_to_lightgray_except_answers() {
    d3.selectAll('.crossword_cells')
        .filter(function(){
            return d3.select(this).style('background-color') != 'lightgreen';
        })
        .style('background-color', 'lightgray');
}

function color_a_cell_except_answers(x,y) {
    if(d3.select(id_of_cell(x, y)).style('background-color') != 'lightgreen')
        d3.select(id_of_cell(x, y)).style('background-color', 'white')
}

function select_a_crossword_cell(el,d) {
    all_cross_cells_to_lightgray_except_answers();
    var q = d.clue;
    var extra = d.extra;
    var x = d.startx - 1;
    var y = d.starty - 1;
    d3.select('#crossword_question').html(extra + " " + q);
    var orientation = d.orientation;
    direction = orientation;
    for(var counter = 0; counter < d.answer.length;counter++) {
        if(orientation == 'across') {
            color_a_cell_except_answers(x + counter, y);
        } else {
            color_a_cell_except_answers(x, y + counter);
        }
    }
}

function select_a_crossword_question(el) {
    all_cross_cells_to_lightgray_except_answers();
    var q = el.getAttribute('question');
    var extra = el.getAttribute('extra');
    d3.select('#crossword_question').html(extra + " " + q);
    var x = el.getAttribute('startx');
    var y = el.getAttribute('starty');
    
    d3.select(id_of_cell(x,y)).node().focus();
    var orientation = el.getAttribute('orientation');
    direction = orientation;
    for(var counter = 0; counter < el.getAttribute('answer').length;counter++) {
        if(orientation == 'across') {
            color_a_cell_except_answers(x + counter, y);
        } else {
            color_a_cell_except_answers(x, y + counter);
        }
    }
}

function fill_crossword(quiz) {
    var input = [];
    for(q of quiz.slice(0,20)) {
        if(!q.choices[q.answer].includes(' ') && q.choices[q.answer].length < 10) {
            input.push({'answer': q.choices[q.answer], 'clue': q.question, 'extra': q.extra});
        }
    }
    var layout = generateLayout(input);
    var rows = layout.rows;
    var cols = layout.cols;
    var table = layout.table; // table as two-dimensional array
    var output_html = layout.table_string; // table as plain text (with HTML line breaks)
    var output_json = layout.result; // words along with orientation, position, startx, and starty
        
    d3.select('#crossword').html("");
    for(var i=0;i<rows;i++) {
        d3.select('#crossword').append('tr').selectAll("td")
        .data(table[i])
        .enter()
        .append("td")
        .style('border', function(d,c){
            if(d == '-' || d=='') return ""; 
            return '1px solid black';})
        .style('border-collapse', 'collapse')
        .style('text-align','center')
        .style('font-size','9px')
        .html(function(d,c) { 
            if(d=='-' || d=='')
                return "<span id='" + id_of_cell_alone(c, i) + "'></span>";
            else 
                return "<input class='crossword_cells' id='" + id_of_cell_alone(c, i) + "' ans='"+ d +"'>"; 
        });

        if(i == rows - 1) {
            
        } 
    }

    
    for(table_q of output_json) {
        var x = table_q.startx;
        var y = table_q.starty;
        var orientation = table_q.orientation;
        var answer = table_q.answer;
        var clue = table_q.clue;
        var extra = table_q.extra;
        for(var i = 0; i < answer.length; i++) {
            if(orientation == 'across') {
                xy_to_data[(x+i) + '_' + y] = {'answer': answer, 'orientation': orientation, 'startx': x, 'starty': y, 'clue': clue, 'extra': extra}; 
            } else {
                xy_to_data[x + '_' + (y+i)] = {'answer': answer, 'orientation': orientation, 'startx': x, 'starty': y, 'clue': clue, 'extra': extra};
            }
        }
    }

    d3.selectAll('input.crossword_cells')
        .on('input', function() {
            if(this.value.length > 1) {
                this.value = this.value.slice(0,1);
            }
            // Convert to uppercase for consistency
            this.value = this.value.toUpperCase();
            
            var tmp = this.id.split('__')[1];
            var x = parseInt(tmp.split('_')[0]);
            var y = parseInt(tmp.split('_')[1]);
            find_suitable_neighbour_for_focus(x,y);
            check_if_answer(x,y);
            
            // Update progress after input
            setTimeout(() => {
                updateProgress();
            }, 100);
            
            return this.value;
        })
        .on('click', function() {
          var id_str = d3.select(this).attr('id');
          xy = get_id_from_str(id_str);
          x = parseInt(xy[0]) + 1;
          y = parseInt(xy[1]) + 1;
          d = xy_to_data[x + '_' + y];
          startx = d.startx - 1;
          starty = d.starty - 1;
          select_a_crossword_cell(d3.select(id_of_cell(startx, starty)).node(), d);
        })
        .on('keydown', function(event) { 
            if(event.key == 'Backspace') {
                // console.log('whatttt Backspace');
            }
        })
        .on('focus', function() {
            lastActiveCell = document.activeElement;
        });


    d3.select('#across_questions').html("");
    d3.select('#down_questions').html("");
    cnt = 1;

    for(table_q of output_json) {
        d3.select(d3.select(id_of_cell(table_q.startx - 1, table_q.starty - 1))
            .node().parentNode)
            .append('span').lower()
            .attr('class', 'crossword_numerics')
            .html(cnt);

            d3.select('#' + table_q.orientation + '_questions')
            .append('span')
            .attr('startx', table_q.startx - 1)
            .attr('starty', table_q.starty - 1)
            .attr('answer', table_q.answer)
            .attr('question', table_q.clue)
            .attr('extra', table_q.extra)
            .attr('orientation', table_q.orientation)
            .style('padding', '5px')
            .attr('class', 'crossword_questions_css')
            .on('click',function() {
                d3.selectAll('.crossword_questions_css').style('color', 'black');
                d3.select(this).style('color', 'red');
                select_a_crossword_question(d3.select(this).node());
             })
            .html(cnt + ". " + " " + table_q.clue + "<br/>");
        cnt++;
    }
    select_a_crossword_question(d3.select('#across_questions').select('span').node());
    
    // Initialize enhanced features
    setupKeyboardNavigation();
    updateProgress();
    
    // Initialize total words count
    totalWords = output_json.filter(q => q.orientation !== 'none').length;
}

// Enhanced functionality for the crossword
var totalWords = 0;
var completedWords = 0;
var gameScore = 0;
var hintsUsed = 0;
var startTime = null;
var timerInterval = null;
var isPaused = false;
var isTimerRunning = false;
var currentDifficulty = 'medium';
var gameStats = {
    startTime: null,
    endTime: null,
    wordsCompleted: 0,
    hintsUsed: 0,
    score: 0,
    timeElapsed: 0
};

function Hint() {
    if (!lastActiveCell) {
        showFeedback('Please click on a cell first to get a hint.', 'warning');
        return;
    }
    
    if (currentDifficulty === 'expert') {
        showFeedback('No hints available in Expert mode!', 'error');
        return;
    }
    
    const cell = d3.select(lastActiveCell);
    const correctLetter = cell.attr('ans');
    
    if (correctLetter) {
        cell.node().value = correctLetter;
        cell.classed('hint-used', true);
        
        hintsUsed++;
        updateStats();
        updateScore(-10); // Small penalty for hint
        
        // Update progress after hint
        setTimeout(() => {
            updateProgress();
            checkGameCompletion();
        }, 100);
        
        showFeedback('Hint used! Letter filled in. (-10 points)', 'info');
    } else {
        showFeedback('No hint available for this cell.', 'warning');
    }
}

// Check all answers at once
function checkAllAnswers() {
    let correctCount = 0;
    let totalCount = 0;
    
    d3.selectAll('.crossword_cells').each(function() {
        const cell = d3.select(this);
        const userValue = this.value.toUpperCase();
        const correctValue = cell.attr('ans');
        
        if (correctValue && userValue) {
            totalCount++;
            if (userValue === correctValue) {
                correctCount++;
                cell.style('background-color', '#d4edda'); // Light green
                cell.style('border-color', '#28a745');
            } else {
                cell.style('background-color', '#f8d7da'); // Light red
                cell.style('border-color', '#dc3545');
            }
        }
    });
    
    showFeedback(`${correctCount} out of ${totalCount} letters correct!`, 'info');
}

// Clear all entries
function clearCrossword() {
    if (confirm('Are you sure you want to clear all entries?')) {
        d3.selectAll('.crossword_cells').each(function() {
            const cell = d3.select(this);
            if (!cell.node().hasAttribute('disabled')) {
                this.value = '';
                cell.style('background-color', 'white');
                cell.style('border-color', '#dee2e6');
            }
        });
        updateProgress();
        showFeedback('Crossword cleared!', 'info');
    }
}

// Update progress indicator
function updateProgress() {
    let filledCells = 0;
    let totalCells = 0;
    
    d3.selectAll('.crossword_cells').each(function() {
        const cell = d3.select(this);
        if (cell.attr('ans')) { // Only count cells that should have letters
            totalCells++;
            if (this.value && this.value.trim() !== '') {
                filledCells++;
            }
        }
    });
    
    const percentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
    
    d3.select('#crossword_progress').style('width', percentage + '%');
    d3.select('#progress_text').text(percentage + '% Complete');
}

// Show feedback messages
function showFeedback(message, type = 'info') {
    // Remove existing feedback
    d3.select('.feedback-message').remove();
    
    const colors = {
        'info': '#007bff',
        'success': '#28a745',
        'warning': '#ffc107',
        'error': '#dc3545'
    };
    
    const feedback = d3.select('#puzzle-piece_page')
        .insert('div', ':first-child')
        .attr('class', 'feedback-message')
        .style('background-color', colors[type] || colors.info)
        .style('color', 'white')
        .style('padding', '10px 20px')
        .style('border-radius', '5px')
        .style('margin-bottom', '15px')
        .style('text-align', 'center')
        .style('font-weight', 'bold')
        .style('opacity', '0')
        .text(message);
    
    // Fade in
    feedback.transition().duration(300).style('opacity', '1');
    
    // Fade out after 3 seconds
    setTimeout(() => {
        feedback.transition().duration(500).style('opacity', '0')
            .on('end', () => feedback.remove());
    }, 3000);
}

// Enhanced keyboard navigation
function setupKeyboardNavigation() {
    d3.selectAll('.crossword_cells').on('keydown', function(event) {
        const currentCell = this;
        const cellId = currentCell.id;
        const coords = get_id_from_str(cellId);
        const x = coords[0];
        const y = coords[1];
        
        let nextCell = null;
        
        switch(event.key) {
            case 'ArrowUp':
                nextCell = d3.select(id_of_cell(x, y - 1)).node();
                break;
            case 'ArrowDown':
                nextCell = d3.select(id_of_cell(x, y + 1)).node();
                break;
            case 'ArrowLeft':
                nextCell = d3.select(id_of_cell(x - 1, y)).node();
                break;
            case 'ArrowRight':
                nextCell = d3.select(id_of_cell(x + 1, y)).node();
                break;
            case 'Backspace':
                if (!currentCell.value) {
                    // Move to previous cell if current is empty
                    if (direction === 'across') {
                        nextCell = d3.select(id_of_cell(x - 1, y)).node();
                    } else {
                        nextCell = d3.select(id_of_cell(x, y - 1)).node();
                    }
                }
                break;
            case 'Tab':
                event.preventDefault();
                // Move to next clue
                const nextQuestion = d3.select('.crossword_questions_css[style*="color: red"]').node();
                if (nextQuestion && nextQuestion.nextElementSibling) {
                    nextQuestion.nextElementSibling.click();
                }
                break;
        }
        
        if (nextCell && !nextCell.hasAttribute('disabled')) {
            nextCell.focus();
        }
    });
}

// Advanced Features Implementation

// Timer functionality
function toggleTimer() {
    if (!isTimerRunning) {
        startTimer();
    } else {
        stopTimer();
    }
}

function startTimer() {
    if (!startTime) {
        startTime = new Date();
        gameStats.startTime = startTime;
    }
    
    isTimerRunning = true;
    isPaused = false;
    
    d3.select('#timer-text').text('Stop Timer');
    d3.select('.pause-button').style('display', 'flex');
    
    timerInterval = setInterval(updateTimer, 1000);
    showFeedback('Timer started!', 'success');
}

function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    
    d3.select('#timer-text').text('Start Timer');
    d3.select('.pause-button').style('display', 'none');
    
    showFeedback('Timer stopped!', 'info');
}

function pauseGame() {
    if (isTimerRunning && !isPaused) {
        isPaused = true;
        clearInterval(timerInterval);
        showPauseOverlay();
        showFeedback('Game paused!', 'warning');
    } else if (isPaused) {
        isPaused = false;
        timerInterval = setInterval(updateTimer, 1000);
        hidePauseOverlay();
        showFeedback('Game resumed!', 'success');
    }
}

function updateTimer() {
    if (startTime && !isPaused) {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        d3.select('#timer_display').text(timeString);
        
        gameStats.timeElapsed = elapsed;
    }
}

function showPauseOverlay() {
    const overlay = d3.select('body')
        .append('div')
        .attr('class', 'pause-overlay')
        .on('click', function() {
            pauseGame(); // Resume on click
        });
    
    const message = overlay
        .append('div')
        .attr('class', 'pause-message');
    
    message.append('h2').text('Game Paused');
    message.append('p').text('Click anywhere to resume');
}

function hidePauseOverlay() {
    d3.select('.pause-overlay').remove();
}

// Advanced hint system
function SuperHint() {
    if (!lastActiveCell) {
        showFeedback('Please click on a cell first to get a super hint.', 'warning');
        return;
    }
    
    if (currentDifficulty === 'expert') {
        showFeedback('No hints available in Expert mode!', 'error');
        return;
    }
    
    const cellId = lastActiveCell.id;
    const coords = get_id_from_str(cellId);
    const x = coords[0] + 1;
    const y = coords[1] + 1;
    const wordData = xy_to_data[x + '_' + y];
    
    if (wordData) {
        // Fill the first letter and show definition
        const cell = d3.select(lastActiveCell);
        const correctLetter = cell.attr('ans');
        cell.node().value = correctLetter;
        cell.classed('super-hint', true);
        
        hintsUsed++;
        updateStats();
        
        // Show enhanced feedback with word info
        const wordLength = wordData.answer.length;
        const hintMessage = `Super Hint: "${correctLetter}" - Word is ${wordLength} letters long. Clue: ${wordData.clue}`;
        showFeedback(hintMessage, 'info');
        
        updateProgress();
        updateScore(-20); // Penalty for super hint
    }
}

function revealCurrentWord() {
    if (!lastActiveCell) {
        showFeedback('Please click on a cell first to reveal the word.', 'warning');
        return;
    }
    
    if (currentDifficulty === 'expert') {
        showFeedback('Word reveal not available in Expert mode!', 'error');
        return;
    }
    
    const cellId = lastActiveCell.id;
    const coords = get_id_from_str(cellId);
    const x = coords[0] + 1;
    const y = coords[1] + 1;
    const wordData = xy_to_data[x + '_' + y];
    
    if (wordData && confirm('Are you sure you want to reveal the entire word? This will significantly reduce your score.')) {
        const startx = wordData.startx;
        const starty = wordData.starty;
        const orientation = wordData.orientation;
        const answer = wordData.answer;
        
        // Fill all letters in the word
        for (let i = 0; i < answer.length; i++) {
            let cellX, cellY;
            if (orientation === 'across') {
                cellX = startx + i - 1;
                cellY = starty - 1;
            } else {
                cellX = startx - 1;
                cellY = starty + i - 1;
            }
            
            const cellElement = d3.select('#' + id_of_cell_alone(cellX, cellY));
            cellElement.node().value = answer[i];
            cellElement.classed('hint-used', true);
        }
        
        hintsUsed += answer.length;
        updateStats();
        updateProgress();
        updateScore(-100); // Heavy penalty for revealing word
        
        showFeedback(`Word "${answer}" revealed! Heavy score penalty applied.`, 'warning');
    }
}

function solveCrossword() {
    if (confirm('Are you sure you want to solve the entire crossword? This will end the game.')) {
        d3.selectAll('.crossword_cells').each(function() {
            const cell = d3.select(this);
            const correctLetter = cell.attr('ans');
            if (correctLetter && !this.hasAttribute('disabled')) {
                this.value = correctLetter;
                cell.style('background-color', '#e9ecef');
            }
        });
        
        stopTimer();
        updateProgress();
        showFeedback('Crossword solved! Game ended.', 'success');
        
        // Show final results
        setTimeout(() => {
            showGameResults('solved');
        }, 2000);
    }
}

// Scoring system
function updateScore(points) {
    gameScore = Math.max(0, gameScore + points);
    gameStats.score = gameScore;
    d3.select('#score_display').text(gameScore);
}

function calculateScore() {
    let baseScore = completedWords * 100;
    let timeBonus = Math.max(0, 1000 - gameStats.timeElapsed);
    let hintPenalty = hintsUsed * 10;
    
    const difficultyMultiplier = {
        'easy': 0.5,
        'medium': 1.0,
        'hard': 1.5,
        'expert': 2.0
    };
    
    let finalScore = (baseScore + timeBonus - hintPenalty) * difficultyMultiplier[currentDifficulty];
    return Math.max(0, Math.round(finalScore));
}

// Statistics updates
function updateStats() {
    d3.select('#hints_used').text(hintsUsed);
    d3.select('#words_completed').text(completedWords);
    d3.select('#score_display').text(gameScore);
}

// Difficulty management
function changeDifficulty() {
    currentDifficulty = d3.select('#difficulty').node().value;
    
    const difficultySettings = {
        'easy': { hints: Infinity, message: 'Easy mode: Unlimited hints available!' },
        'medium': { hints: 10, message: 'Medium mode: Limited hints available.' },
        'hard': { hints: 5, message: 'Hard mode: Very few hints available.' },
        'expert': { hints: 0, message: 'Expert mode: No hints available!' }
    };
    
    const setting = difficultySettings[currentDifficulty];
    showFeedback(setting.message, 'info');
    
    // Update button states based on difficulty
    updateButtonStates();
}

function updateButtonStates() {
    const isExpert = currentDifficulty === 'expert';
    
    d3.select('.hint-button').property('disabled', isExpert);
    d3.select('.super-hint-button').property('disabled', isExpert);
    d3.select('.reveal-word-button').property('disabled', isExpert);
    
    if (isExpert) {
        d3.selectAll('.hint-button, .super-hint-button, .reveal-word-button')
            .style('opacity', '0.5')
            .style('cursor', 'not-allowed');
    } else {
        d3.selectAll('.hint-button, .super-hint-button, .reveal-word-button')
            .style('opacity', '1')
            .style('cursor', 'pointer');
    }
}

// Game reset functionality
function resetGame() {
    if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        // Reset all game variables
        gameScore = 0;
        hintsUsed = 0;
        completedWords = 0;
        startTime = null;
        isTimerRunning = false;
        isPaused = false;
        
        // Clear timer
        clearInterval(timerInterval);
        
        // Reset display
        d3.select('#timer_display').text('00:00');
        d3.select('#timer-text').text('Start Timer');
        d3.select('.pause-button').style('display', 'none');
        
        // Clear crossword
        clearCrossword();
        
        // Reset stats
        gameStats = {
            startTime: null,
            endTime: null,
            wordsCompleted: 0,
            hintsUsed: 0,
            score: 0,
            timeElapsed: 0
        };
        
        updateStats();
        hidePauseOverlay();
        
        showFeedback('Game reset successfully!', 'success');
    }
}

// Game completion detection and results
function checkGameCompletion() {
    let totalCells = 0;
    let filledCorrectly = 0;
    
    d3.selectAll('.crossword_cells').each(function() {
        const cell = d3.select(this);
        const correctValue = cell.attr('ans');
        if (correctValue) {
            totalCells++;
            if (this.value.toUpperCase() === correctValue) {
                filledCorrectly++;
            }
        }
    });
    
    if (filledCorrectly === totalCells && totalCells > 0) {
        gameCompleted();
    }
}

function gameCompleted() {
    stopTimer();
    gameStats.endTime = new Date();
    gameStats.score = calculateScore();
    
    showFeedback('Congratulations! Crossword completed!', 'success');
    
    setTimeout(() => {
        showGameResults('completed');
    }, 2000);
}

function showGameResults(completionType) {
    const modal = d3.select('body')
        .append('div')
        .attr('class', 'pause-overlay');
    
    const results = modal
        .append('div')
        .attr('class', 'pause-message')
        .style('max-width', '500px');
    
    results.append('h2').text(
        completionType === 'completed' ? 'Crossword Completed!' : 'Game Results'
    );
    
    const statsDiv = results.append('div').style('text-align', 'left');
    
    statsDiv.append('p').html(`<strong>Final Score:</strong> ${gameStats.score}`);
    statsDiv.append('p').html(`<strong>Time Elapsed:</strong> ${Math.floor(gameStats.timeElapsed / 60)}:${(gameStats.timeElapsed % 60).toString().padStart(2, '0')}`);
    statsDiv.append('p').html(`<strong>Words Completed:</strong> ${completedWords}/${totalWords}`);
    statsDiv.append('p').html(`<strong>Hints Used:</strong> ${hintsUsed}`);
    statsDiv.append('p').html(`<strong>Difficulty:</strong> ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}`);
    
    const buttonDiv = results.append('div').style('margin-top', '20px');
    
    buttonDiv.append('button')
        .attr('class', 'button button5')
        .style('margin', '5px')
        .text('Play Again')
        .on('click', () => {
            modal.remove();
            resetGame();
        });
    
    buttonDiv.append('button')
        .attr('class', 'button button5')
        .style('margin', '5px')
        .text('Close')
        .on('click', () => {
            modal.remove();
        });
}
