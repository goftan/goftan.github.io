/**
 * E2E tests: hangman page — SVG stages, lives display, win/lose states.
 */

const { test, expect } = require('@playwright/test');
const { startHangman } = require('./helpers');

test.describe('Hangman game', () => {

    test('hangman page is visible with SVG and lives', async ({ page }) => {
        await startHangman(page);
        await expect(page.locator('#hangman_svg')).toBeVisible();
        await expect(page.locator('#hangman_lives')).toBeVisible();
        await expect(page.locator('#hangman_answer')).toBeVisible();
        await expect(page.locator('#hangman_hint')).toBeVisible();
    });

    test('all SVG body parts are hidden at start', async ({ page }) => {
        await startHangman(page);
        for (const id of ['hm-head', 'hm-body', 'hm-left-arm', 'hm-right-arm', 'hm-left-leg', 'hm-right-leg']) {
            const display = await page.locator(`#${id}`).evaluate(el => el.style.display);
            expect(display).toBe('none');
        }
    });

    test('all 6 hearts are visible at start, none lost', async ({ page }) => {
        await startHangman(page);
        await expect(page.locator('.hm-life')).toHaveCount(6);
        await expect(page.locator('.hm-life-lost')).toHaveCount(0);
    });

    test('wrong guess reveals head and marks one life lost', async ({ page }) => {
        await startHangman(page);

        // Read the hidden word and find a letter NOT in it
        const word = await page.evaluate(() => selected_word.toUpperCase());
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let clicked = false;

        for (const letter of alphabet) {
            if (!word.includes(letter)) {
                const btn = page.locator(`#hangman_letter_${letter}`);
                if (await btn.count() > 0 && !(await btn.isDisabled())) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }
        }

        if (!clicked) {
            // Skip if word uses every letter of the alphabet (extremely unlikely)
            test.skip();
            return;
        }

        // Head should now be visible
        const headDisplay = await page.locator('#hm-head').evaluate(el => el.style.display);
        expect(headDisplay).not.toBe('none');

        // One life should be lost
        await expect(page.locator('.hm-life-lost')).toHaveCount(1);
    });

    test('each wrong guess reveals the next body part in order', async ({ page }) => {
        await startHangman(page);
        const parts = ['hm-head', 'hm-body', 'hm-left-arm', 'hm-right-arm', 'hm-left-leg', 'hm-right-leg'];
        const word = await page.evaluate(() => selected_word.toUpperCase());
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
        let wrongCount = 0;

        for (const letter of alphabet) {
            if (wrongCount >= parts.length) break;
            if (word.includes(letter)) continue;
            const btn = page.locator(`#hangman_letter_${letter}`);
            if (await btn.count() === 0 || await btn.isDisabled()) continue;

            await btn.click();
            wrongCount++;

            // The part at index wrongCount-1 should now be visible
            const display = await page.locator(`#${parts[wrongCount - 1]}`).evaluate(el => el.style.display);
            expect(display).not.toBe('none');
        }
    });

    test('game over state: status message and all buttons disabled', async ({ page }) => {
        await startHangman(page);
        const word = await page.evaluate(() => selected_word.toUpperCase());
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
        let wrongCount = 0;

        for (const letter of alphabet) {
            if (wrongCount >= 6) break;
            if (word.includes(letter)) continue;
            const btn = page.locator(`#hangman_letter_${letter}`);
            if (await btn.count() === 0 || await btn.isDisabled()) continue;
            await btn.click();
            wrongCount++;
        }

        if (wrongCount < 6) { test.skip(); return; }

        // Game over message
        await expect(page.locator('.hm-gameover')).toBeVisible();
        await expect(page.locator('#hangman_status')).toContainText('Game Over');

        // All alphabet buttons disabled
        const enabledCount = await page.locator('.hm-letter-btn:not([disabled])').count();
        expect(enabledCount).toBe(0);
    });

    test('solving the word shows win message', async ({ page }) => {
        await startHangman(page);
        const word = await page.evaluate(() => selected_word.toUpperCase());

        // Click every unique letter in the word
        const letters = [...new Set(word.split(''))];
        for (const letter of letters) {
            const btn = page.locator(`#hangman_letter_${letter}`);
            if (await btn.count() > 0 && !(await btn.isDisabled())) {
                await btn.click();
            }
        }

        // Win message should appear
        await expect(page.locator('.hm-win')).toBeVisible();
        await expect(page.locator('#hangman_status')).toContainText('solved');
    });

    test('answer blanks are replaced by correct letters as guessed', async ({ page }) => {
        await startHangman(page);
        const word = await page.evaluate(() => selected_word.toUpperCase());

        // Initially all underscores
        const initial = await page.locator('#hangman_answer').textContent();
        expect(initial.trim()).toMatch(/^_+$/);

        // Guess the first letter of the word
        const firstLetter = word[0];
        const btn = page.locator(`#hangman_letter_${firstLetter}`);
        if (await btn.count() > 0 && !(await btn.isDisabled())) {
            await btn.click();
            const after = await page.locator('#hangman_answer').textContent();
            // At least one underscore replaced with that letter
            expect(after.toUpperCase()).toContain(firstLetter);
        }
    });

});
