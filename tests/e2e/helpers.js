/**
 * Shared Playwright helpers for Goftan quiz E2E tests.
 */

const QUIZ_URL = '/quiz/';

/**
 * Navigates to the quiz, selects German, sets question count,
 * leaves only Multiple Choice checked, then clicks Start Quiz.
 * Resolves when the question page is visible.
 */
async function startMCQuiz(page, numQuestions = 3) {
    await page.goto(QUIZ_URL);
    await page.click('label:has-text("German")');
    await page.click('#startLearning');
    await page.fill('#num_of_questions', String(numQuestions));

    // Uncheck non-MC quiz types (inputs are opacity:0 custom checkboxes — use evaluate)
    await page.evaluate(() => {
        document.querySelectorAll('input.mycheckboxqtypes[name="topics"]').forEach(cb => {
            if (cb.value === 'Crossword' || cb.value === 'Hangman') cb.checked = false;
            if (cb.value === 'Multiple Choice') cb.checked = true;
        });
    });

    await page.click('#startQuizButton');
    await page.locator('#question_page').waitFor({ state: 'visible', timeout: 8000 });
}

/**
 * Navigates to the quiz and starts a Hangman-only session.
 * Resolves when the hangman page is visible (or times out if no word found).
 */
async function startHangman(page) {
    await page.goto(QUIZ_URL);
    await page.click('label:has-text("German")');
    await page.click('#startLearning');
    await page.fill('#num_of_questions', '5');

    // Uncheck non-Hangman quiz types (inputs are opacity:0 custom checkboxes — use evaluate)
    await page.evaluate(() => {
        document.querySelectorAll('input.mycheckboxqtypes[name="topics"]').forEach(cb => {
            if (cb.value === 'Crossword' || cb.value === 'Multiple Choice') cb.checked = false;
            if (cb.value === 'Hangman') cb.checked = true;
        });
    });

    await page.click('#startQuizButton');
    await page.locator('#sign-hanging_page').waitFor({ state: 'visible', timeout: 8000 });
}

/**
 * Returns the 1-based index (1–4) of the button showing the correct answer
 * for the current question. Uses the live quiz state via page.evaluate.
 */
async function getCorrectOptionIdx(page) {
    return page.evaluate(() => {
        const q = quiz[countQues];
        const correct = q.choices[q.answer].trim();
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('opt' + i);
            if (el && el.textContent.trim() === correct) return i;
        }
        return 1; // fallback
    });
}

/**
 * Returns the 1-based index of any button that does NOT show the correct answer.
 */
async function getWrongOptionIdx(page) {
    return page.evaluate(() => {
        const q = quiz[countQues];
        const correct = q.choices[q.answer].trim();
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('opt' + i);
            if (el && el.textContent.trim() !== correct) return i;
        }
        return 2; // fallback
    });
}

/**
 * Answers `count` questions, all correctly (or all wrongly if correct=false),
 * then clicks Next after each one.
 */
async function answerQuestions(page, count, correct = true) {
    for (let i = 0; i < count; i++) {
        const idx = correct
            ? await getCorrectOptionIdx(page)
            : await getWrongOptionIdx(page);
        await page.click(`#opt${idx}`);
        await page.waitForFunction(() => document.getElementById('opt1')?.disabled === true);
        await page.click('#nextQuestion');
    }
}

/**
 * Navigates to the quiz and starts a Crossword-only session.
 * Resolves when the crossword grid has at least one input cell.
 *
 * Strategy: fill_crossword() processes all quiz questions (can be 800+) which
 * is CPU-bound and takes variable time. Rather than waiting for the app to call
 * selectPage(), we wait for the crossword data to be ready (cells rendered) and
 * then explicitly navigate to the crossword page via evaluate — this avoids
 * flakiness from timing races between rendering and Playwright's visibility check.
 */
async function startCrossword(page) {
    await page.goto(QUIZ_URL);
    await page.click('label:has-text("German")');
    await page.click('#startLearning');
    await page.fill('#num_of_questions', '10');

    // Uncheck non-Crossword quiz types (inputs are opacity:0 custom checkboxes — use evaluate)
    await page.evaluate(() => {
        document.querySelectorAll('input.mycheckboxqtypes[name="topics"]').forEach(cb => {
            if (cb.value === 'Multiple Choice' || cb.value === 'Hangman') cb.checked = false;
            if (cb.value === 'Crossword') cb.checked = true;
        });
    });

    await page.click('#startQuizButton');

    // Wait for fill_crossword() to have rendered at least one grid cell
    // (this is the real "ready" signal — selectPage timing is unreliable)
    await page.waitForFunction(
        () => document.querySelectorAll('input.crossword_cells').length > 0,
        { timeout: 20000 }
    );

    // Ensure the crossword page is actually visible (force it if needed)
    await page.evaluate(() => {
        if (document.getElementById('puzzle-piece_page').style.display !== 'block') {
            selectPage('puzzle-piece_page');
        }
    });

    await page.locator('#puzzle-piece_page').waitFor({ state: 'visible', timeout: 3000 });
}

module.exports = { QUIZ_URL, startMCQuiz, startHangman, startCrossword, getCorrectOptionIdx, getWrongOptionIdx, answerQuestions };
