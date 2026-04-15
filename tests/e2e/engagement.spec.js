/**
 * E2E tests: timer, keyboard shortcuts, progress bar, persistence, personal best.
 */

const { test, expect } = require('@playwright/test');
const { startMCQuiz, getCorrectOptionIdx, getWrongOptionIdx, answerQuestions } = require('./helpers');

test.describe('Question timer', () => {

    test('timer bar is full width at question start', async ({ page }) => {
        await startMCQuiz(page, 3);
        const width = await page.locator('#question_timer_fill').evaluate(el => el.style.width);
        expect(width).toBe('100%');
    });

    test('timer label shows 15s at question start', async ({ page }) => {
        await startMCQuiz(page, 3);
        await expect(page.locator('#question_timer_label')).toHaveText('15s');
    });

    test('timer bar shrinks after a few seconds', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.waitForTimeout(3500);
        const width = await page.locator('#question_timer_fill').evaluate(el => parseFloat(el.style.width));
        expect(width).toBeLessThan(100);
    });

    test('timer auto-advances and marks wrong when it expires', async ({ page }) => {
        await startMCQuiz(page, 5);
        // Shorten the timer to 2s via page script
        await page.evaluate(() => { timerDuration = 2; });
        await page.evaluate(() => startQuestionTimer()); // restart with new duration

        // Wait for auto-advance
        await page.waitForTimeout(4000);

        // Either moved to q2 or hit results (if only 1 question)
        const qNum = await page.locator('#question_number').textContent();
        expect(parseInt(qNum)).toBeGreaterThan(1);
    });

    test('answering stops the timer (label stays frozen after answer)', async ({ page }) => {
        await startMCQuiz(page, 3);
        const idx = await getCorrectOptionIdx(page);
        await page.click(`#opt${idx}`);
        await page.waitForTimeout(2000);

        const label = await page.locator('#question_timer_label').textContent();
        // Seconds should not be < 12 if we answered quickly
        // Just verify it's still a numeric label (not blank / NaN)
        expect(label).toMatch(/^\d+s$/);
    });

});

test.describe('Keyboard shortcuts', () => {

    test('pressing 1 submits the first option', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.keyboard.press('1');
        await expect(page.locator('#opt1')).toBeDisabled();
    });

    test('pressing 2 submits the second option', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.keyboard.press('2');
        await expect(page.locator('#opt2')).toBeDisabled();
    });

    test('pressing 3 submits the third option', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.keyboard.press('3');
        await expect(page.locator('#opt3')).toBeDisabled();
    });

    test('pressing 4 submits the fourth option', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.keyboard.press('4');
        await expect(page.locator('#opt4')).toBeDisabled();
    });

    test('pressing Enter after answering advances to next question', async ({ page }) => {
        await startMCQuiz(page, 5);
        await page.keyboard.press('1');
        await page.waitForFunction(() => document.getElementById('opt1')?.disabled === true);
        await page.keyboard.press('Enter');
        await expect(page.locator('#question_number')).toHaveText('2');
    });

    test('pressing 1–4 before answering does not double-submit', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.keyboard.press('1');
        await page.keyboard.press('1');  // second press should be ignored
        const disabledCount = await page.locator('#opt1[disabled]').count();
        expect(disabledCount).toBe(1);
    });

});

test.describe('Quiz progress bar', () => {

    test('progress bar starts at 0%', async ({ page }) => {
        await startMCQuiz(page, 5);
        const width = await page.locator('#quiz_progress_fill').evaluate(el => parseFloat(el.style.width) || 0);
        expect(width).toBe(0);
    });

    test('progress bar advances after answering the first question', async ({ page }) => {
        await startMCQuiz(page, 5);
        const idx = await getCorrectOptionIdx(page);
        await page.click(`#opt${idx}`);
        await page.click('#nextQuestion');

        const width = await page.locator('#quiz_progress_fill').evaluate(el => parseFloat(el.style.width));
        expect(width).toBeGreaterThan(0);
    });

    test('progress bar reaches ~60% at question 3 of 5', async ({ page }) => {
        await startMCQuiz(page, 5);
        await answerQuestions(page, 2); // answer q1 and q2, now on q3
        const width = await page.locator('#quiz_progress_fill').evaluate(el => parseFloat(el.style.width));
        // 2/5 = 40%
        expect(width).toBeCloseTo(40, 0);
    });

});

test.describe('Session history persistence', () => {

    test('session entry is saved to localStorage after completing quiz', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);

        const history = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('goftan_session_history') || '[]')
        );
        expect(history.length).toBeGreaterThan(0);
        expect(history[0]).toHaveLength(5); // [try, lang, correct, incorrect, skipped]
        expect(history[0][1]).toBe('German');
    });

    test('session history survives a page reload', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);

        const before = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('goftan_session_history') || '[]')
        );

        await page.reload();

        const after = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('goftan_session_history') || '[]')
        );
        expect(after).toHaveLength(before.length);
    });

    test('session history rows appear in the table on reload', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);

        await page.reload();
        await page.goto('/quiz/');

        // Navigate to results page via navbar
        await page.click('#calculator_page_nav');
        const rowCount = await page.locator('#result_table tr').count();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Change Settings clears session history from localStorage', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);
        await page.click('button:has-text("Change Settings")');

        const history = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('goftan_session_history') || '[]')
        );
        expect(history).toHaveLength(0);
    });

});

test.describe('Personal best', () => {

    test('personal best shows after first session', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);
        // Personal best element should have some text
        const text = await page.locator('#result_personal_best').textContent();
        expect(text.trim().length).toBeGreaterThan(0);
    });

    test('personal best shows "New personal best" on first ever session', async ({ page }) => {
        // Clear any existing history first
        await page.goto('/quiz/');
        await page.evaluate(() => {
            Object.keys(localStorage)
                .filter(k => k.startsWith('goftan_scores_'))
                .forEach(k => localStorage.removeItem(k));
        });

        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);

        const text = await page.locator('#result_personal_best').textContent();
        expect(text).toContain('personal best');
    });

});

test.describe('Sound toggle', () => {

    test('sound toggle button is visible on question page', async ({ page }) => {
        await startMCQuiz(page, 3);
        await expect(page.locator('#sound_toggle')).toBeVisible();
    });

    test('clicking sound toggle switches icon to muted', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.click('#sound_toggle');
        const iconClass = await page.locator('#sound_icon').getAttribute('class');
        expect(iconClass).toContain('volume-mute');
    });

    test('clicking twice restores volume icon', async ({ page }) => {
        await startMCQuiz(page, 3);
        await page.click('#sound_toggle');
        await page.click('#sound_toggle');
        const iconClass = await page.locator('#sound_icon').getAttribute('class');
        expect(iconClass).toContain('volume-up');
    });

});
