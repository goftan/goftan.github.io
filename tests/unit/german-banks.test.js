/**
 * The German word and sentence banks are built by tools/question-generator/add_levels.py.
 * These checks pin what that build guarantees, so a regenerated bank that breaks
 * the level filter or contains ambiguous questions fails here.
 */
const fs = require('fs');
const path = require('path');

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const load = name => JSON.parse(fs.readFileSync(path.join(__dirname, '../../quiz/German', name), 'utf8'));

describe.each([['CommonWords.json', 1500], ['CommonSentences.json', 400]])('German/%s', (file, minimum) => {
    const bank = load(file);

    test('is a full bank, not a sample', () => {
        expect(bank.length).toBeGreaterThanOrEqual(minimum);
    });

    test('every question has a known level, four distinct choices and a valid answer', () => {
        const bad = bank.filter(q =>
            !LEVELS.includes(q.level) ||
            !Array.isArray(q.choices) || q.choices.length !== 4 ||
            new Set(q.choices.map(c => c.trim().toLowerCase())).size !== 4 ||
            !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 ||
            !q.question || !q.question.trim());
        expect(bad).toEqual([]);
    });

    test('no question text is repeated', () => {
        const texts = bank.map(q => q.question.trim());
        expect(new Set(texts).size).toBe(texts.length);
    });

    test('every level has a usable number of questions', () => {
        LEVELS.forEach(level => {
            expect(bank.filter(q => q.level === level).length).toBeGreaterThanOrEqual(50);
        });
    });
});
