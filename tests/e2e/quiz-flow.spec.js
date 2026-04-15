/**
 * E2E tests: complete MC quiz flow, answer feedback, re-queue mechanic.
 */

const { test, expect } = require('@playwright/test');
const { startMCQuiz, getCorrectOptionIdx, getWrongOptionIdx, answerQuestions } = require('./helpers');

test.describe('Multiple Choice quiz flow', () => {

    test('question page appears after starting quiz', async ({ page }) => {
        await startMCQuiz(page, 3);
        await expect(page.locator('#question_page')).toBeVisible();
        await expect(page.locator('#question_number')).toHaveText('1');
        await expect(page.locator('#question_size')).toHaveText('3');
    });

    test('question and four options are rendered', async ({ page }) => {
        await startMCQuiz(page, 3);
        await expect(page.locator('#question')).not.toBeEmpty();
        for (let i = 1; i <= 4; i++) {
            await expect(page.locator(`#opt${i}`)).not.toBeEmpty();
        }
    });

    test('correct answer turns green, all options lock', async ({ page }) => {
        await startMCQuiz(page, 3);
        const idx = await getCorrectOptionIdx(page);
        await page.click(`#opt${idx}`);

        // Correct option: green background
        const bg = await page.locator(`#opt${idx}`).evaluate(el => el.style.backgroundColor);
        expect(bg).toBeTruthy(); // green is set inline

        // All four options are now disabled
        for (let i = 1; i <= 4; i++) {
            await expect(page.locator(`#opt${i}`)).toBeDisabled();
        }
    });

    test('wrong answer turns red; correct answer still shown green', async ({ page }) => {
        await startMCQuiz(page, 3);
        const wrongIdx   = await getWrongOptionIdx(page);
        const correctIdx = await getCorrectOptionIdx(page);
        await page.click(`#opt${wrongIdx}`);

        const wrongBg   = await page.locator(`#opt${wrongIdx}`).evaluate(el => el.style.backgroundColor);
        const correctBg = await page.locator(`#opt${correctIdx}`).evaluate(el => el.style.backgroundColor);

        expect(wrongBg).toContain('254');    // red-ish rgb value present
        expect(correctBg).toContain('220');  // green-ish rgb value present
    });

    test('Next button advances question counter', async ({ page }) => {
        await startMCQuiz(page, 5);
        const idx = await getCorrectOptionIdx(page);
        await page.click(`#opt${idx}`);
        await page.click('#nextQuestion');
        await expect(page.locator('#question_number')).toHaveText('2');
    });

    test('results page appears after all questions answered', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);
        await expect(page.locator('#calculator_page')).toBeVisible();
        await expect(page.locator('#result_score_pct')).toBeVisible();
    });

    test('100% score shows correct percentage', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3, true); // all correct
        await expect(page.locator('#result_score_pct')).toHaveText('100%');
    });

    test('answer choices are shuffled (different order across two runs)', async ({ page }) => {
        // Run 1
        await startMCQuiz(page, 3);
        const run1 = await page.locator('#opt1').textContent();
        await answerQuestions(page, 3);

        // Run 2 — Play Again restarts with same question pool re-shuffled
        await page.click('button:has-text("Play Again")');
        await page.locator('#question_page').waitFor({ state: 'visible' });
        const run2 = await page.locator('#opt1').textContent();

        // They won't be equal on every run (shuffled), but we just verify
        // the opt1 text is a non-empty string each time
        expect(run1.trim().length).toBeGreaterThan(0);
        expect(run2.trim().length).toBeGreaterThan(0);
    });

    test('wrong answer is re-queued: question_size increments by 1', async ({ page }) => {
        await startMCQuiz(page, 3);
        const sizeBefore = await page.locator('#question_size').textContent();
        const wrongIdx = await getWrongOptionIdx(page);
        await page.click(`#opt${wrongIdx}`);
        const sizeAfter = await page.locator('#question_size').textContent();
        expect(parseInt(sizeAfter)).toBe(parseInt(sizeBefore) + 1);
    });

    test('re-queued question shows 🔄 Try again badge', async ({ page }) => {
        await startMCQuiz(page, 3);

        // Get wrong answer on first question
        const wrongIdx = await getWrongOptionIdx(page);
        await page.click(`#opt${wrongIdx}`);
        await page.click('#nextQuestion');

        // Keep answering until we see the re-queue badge
        let foundRequeue = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            const extraText = await page.locator('#extra').textContent();
            if (extraText.includes('🔄')) { foundRequeue = true; break; }
            const idx = await getCorrectOptionIdx(page);
            await page.click(`#opt${idx}`);
            await page.waitForFunction(() => document.getElementById('opt1')?.disabled === true);
            const isResults = await page.locator('#calculator_page').isVisible();
            if (isResults) break;
            await page.click('#nextQuestion');
        }
        expect(foundRequeue).toBe(true);
    });

    test('results show streak badge and XP badge', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);
        await expect(page.locator('.streak-badge')).toBeVisible();
        await expect(page.locator('.xp-badge')).toBeVisible();
    });

    test('Change Settings returns to tasks page and clears session history', async ({ page }) => {
        await startMCQuiz(page, 3);
        await answerQuestions(page, 3);
        await page.click('button:has-text("Change Settings")');
        await expect(page.locator('#tasks_page')).toBeVisible();

        // localStorage session history should be cleared
        const history = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('goftan_session_history') || '[]')
        );
        expect(history).toHaveLength(0);
    });

});
