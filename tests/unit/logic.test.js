/**
 * Unit tests for quiz/js_src/logic.js
 * Run with: npm test
 */

const {
    shuffleArray,
    calcScore,
    getGradeText,
    appendScoreHistory,
    getPersonalBest,
    calcStreakAndXP,
    getWeakTopic,
    getNextDifficultyLevel,
    calcRequeueInsertAt,
    LEVEL_ORDER,
} = require('../../quiz/js_src/logic.js');

// ─── shuffleArray ────────────────────────────────────────────────────────────

describe('shuffleArray', () => {
    test('returns the same array reference', () => {
        const arr = [1, 2, 3, 4];
        expect(shuffleArray(arr)).toBe(arr);
    });

    test('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        shuffleArray(copy);
        expect(copy.sort()).toEqual(original.sort());
    });

    test('handles empty array without error', () => {
        expect(() => shuffleArray([])).not.toThrow();
    });

    test('handles single-element array', () => {
        const arr = [42];
        shuffleArray(arr);
        expect(arr).toEqual([42]);
    });

    test('produces at least one different ordering across many runs', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8];
        let differentFound = false;
        for (let i = 0; i < 50; i++) {
            const copy = [...original];
            shuffleArray(copy);
            if (copy.join(',') !== original.join(',')) { differentFound = true; break; }
        }
        expect(differentFound).toBe(true);
    });
});

// ─── calcScore ───────────────────────────────────────────────────────────────

describe('calcScore', () => {
    test('7 correct out of 10 → 70%', () => {
        expect(calcScore(7, 0, 10).pct).toBe(70);
    });

    test('perfect score → 100%', () => {
        expect(calcScore(10, 0, 10).pct).toBe(100);
    });

    test('zero correct → 0%', () => {
        expect(calcScore(0, 10, 10).pct).toBe(0);
    });

    test('rounds to nearest integer', () => {
        expect(calcScore(1, 0, 3).pct).toBe(33); // 33.33…
        expect(calcScore(2, 0, 3).pct).toBe(67); // 66.66…
    });

    test('skipped = total - correct - incorrect', () => {
        expect(calcScore(6, 2, 10).skipped).toBe(2);
    });

    test('skipped is clamped to 0 (no negatives)', () => {
        expect(calcScore(6, 6, 10).skipped).toBe(0);
    });

    test('total = 0 returns 0% without dividing by zero', () => {
        expect(calcScore(0, 0, 0).pct).toBe(0);
    });
});

// ─── getGradeText ────────────────────────────────────────────────────────────

describe('getGradeText', () => {
    test('90+ → Excellent', () => expect(getGradeText(90)).toContain('Excellent'));
    test('100 → Excellent',  () => expect(getGradeText(100)).toContain('Excellent'));
    test('70 → Good job',    () => expect(getGradeText(70)).toContain('Good job'));
    test('89 → Good job',    () => expect(getGradeText(89)).toContain('Good job'));
    test('50 → Keep practicing', () => expect(getGradeText(50)).toContain('Keep practicing'));
    test('69 → Keep practicing', () => expect(getGradeText(69)).toContain('Keep practicing'));
    test('49 → Don\'t give up',  () => expect(getGradeText(49)).toContain('give up'));
    test('0  → Don\'t give up',  () => expect(getGradeText(0)).toContain('give up'));
});

// ─── appendScoreHistory ───────────────────────────────────────────────────────

describe('appendScoreHistory', () => {
    test('appends to empty array', () => {
        expect(appendScoreHistory([], 75)).toEqual([75]);
    });

    test('appends to existing history', () => {
        expect(appendScoreHistory([60, 70], 80)).toEqual([60, 70, 80]);
    });

    test('does not mutate the original array', () => {
        const orig = [50, 60];
        appendScoreHistory(orig, 70);
        expect(orig).toEqual([50, 60]);
    });

    test('caps at 20 entries by default', () => {
        const history = Array.from({ length: 20 }, (_, i) => i * 5);
        const result = appendScoreHistory(history, 99);
        expect(result).toHaveLength(20);
        expect(result[result.length - 1]).toBe(99);
    });

    test('respects custom maxEntries', () => {
        const history = [10, 20, 30];
        const result = appendScoreHistory(history, 40, 3);
        expect(result).toHaveLength(3);
        expect(result).toEqual([20, 30, 40]);
    });
});

// ─── getPersonalBest ─────────────────────────────────────────────────────────

describe('getPersonalBest', () => {
    test('returns null for empty array', () => {
        expect(getPersonalBest([])).toBeNull();
    });

    test('returns null for null input', () => {
        expect(getPersonalBest(null)).toBeNull();
    });

    test('returns single value', () => {
        expect(getPersonalBest([42])).toBe(42);
    });

    test('returns max of multiple values', () => {
        expect(getPersonalBest([60, 90, 75, 85])).toBe(90);
    });

    test('handles all same values', () => {
        expect(getPersonalBest([70, 70, 70])).toBe(70);
    });
});

// ─── calcStreakAndXP ─────────────────────────────────────────────────────────

describe('calcStreakAndXP', () => {
    const TODAY = 'Mon Jan 06 2025';
    const YESTERDAY = 'Sun Jan 05 2025';
    const TWO_DAYS_AGO = 'Sat Jan 04 2025';

    test('first ever play: streak = 1, no bonus', () => {
        const result = calcStreakAndXP({}, TODAY, YESTERDAY, 5);
        expect(result.streak).toBe(1);
        expect(result.streakBonus).toBe(0);
        expect(result.earnedXP).toBe(50); // 5 × 10
        expect(result.xp).toBe(50);
    });

    test('consecutive day: streak increments', () => {
        const result = calcStreakAndXP({ streak: 3, lastPlayed: YESTERDAY, xp: 100 }, TODAY, YESTERDAY, 7);
        expect(result.streak).toBe(4);
        expect(result.streakBonus).toBe(50);
        expect(result.earnedXP).toBe(120); // 7×10 + 50 bonus
        expect(result.xp).toBe(220);
    });

    test('gap in days: streak resets to 1', () => {
        const result = calcStreakAndXP({ streak: 10, lastPlayed: TWO_DAYS_AGO, xp: 500 }, TODAY, YESTERDAY, 3);
        expect(result.streak).toBe(1);
        expect(result.streakBonus).toBe(0);
        expect(result.xp).toBe(530);
    });

    test('playing twice on the same day does not increment streak', () => {
        const result = calcStreakAndXP({ streak: 2, lastPlayed: TODAY, xp: 200 }, TODAY, YESTERDAY, 4);
        expect(result.streak).toBe(2);
    });

    test('does not mutate the input object', () => {
        const input = { streak: 1, lastPlayed: YESTERDAY, xp: 10 };
        calcStreakAndXP(input, TODAY, YESTERDAY, 5);
        expect(input.xp).toBe(10); // unchanged
    });

    test('xp 0 correct answers still applies streak bonus', () => {
        const result = calcStreakAndXP({ streak: 3, lastPlayed: YESTERDAY, xp: 0 }, TODAY, YESTERDAY, 0);
        expect(result.earnedXP).toBe(50); // 0×10 + 50 streak bonus
    });
});

// ─── getWeakTopic ────────────────────────────────────────────────────────────

describe('getWeakTopic', () => {
    test('returns null for empty wrong answers', () => {
        expect(getWeakTopic([])).toBeNull();
    });

    test('returns null for null input', () => {
        expect(getWeakTopic(null)).toBeNull();
    });

    test('returns the topic with most misses', () => {
        const wrong = [
            { _topic: 'Colors' },
            { _topic: 'Animals' },
            { _topic: 'Colors' },
            { _topic: 'Colors' },
            { _topic: 'Animals' },
        ];
        const result = getWeakTopic(wrong);
        expect(result.topic).toBe('Colors');
        expect(result.count).toBe(3);
    });

    test('filters out Unknown topics', () => {
        const wrong = [
            { _topic: 'Unknown' },
            { _topic: 'Unknown' },
            { _topic: 'Animals' },
        ];
        expect(getWeakTopic(wrong).topic).toBe('Animals');
    });

    test('returns null when all topics are Unknown', () => {
        const wrong = [{ _topic: 'Unknown' }, {}];
        expect(getWeakTopic(wrong)).toBeNull();
    });

    test('handles missing _topic field (treated as Unknown)', () => {
        const wrong = [{ question: 'What?' }, { _topic: 'Numbers' }];
        expect(getWeakTopic(wrong).topic).toBe('Numbers');
    });
});

// ─── getNextDifficultyLevel ──────────────────────────────────────────────────

describe('getNextDifficultyLevel', () => {
    test('score below threshold returns null', () => {
        expect(getNextDifficultyLevel(80, ['A1'])).toBeNull();
    });

    test('A1 at 85% → A2', () => {
        expect(getNextDifficultyLevel(85, ['A1'])).toBe('A2');
    });

    test('A1 + A2 selected, 90% → B1 (next above highest)', () => {
        expect(getNextDifficultyLevel(90, ['A1', 'A2'])).toBe('B1');
    });

    test('B2 at 100% → null (already at max)', () => {
        expect(getNextDifficultyLevel(100, ['B2'])).toBeNull();
    });

    test('Beginner at 90% → A1', () => {
        expect(getNextDifficultyLevel(90, ['Beginner'])).toBe('A1');
    });

    test('empty selected levels → null', () => {
        expect(getNextDifficultyLevel(95, [])).toBeNull();
    });

    test('respects custom threshold', () => {
        expect(getNextDifficultyLevel(70, ['A1'], 70)).toBe('A2');
        expect(getNextDifficultyLevel(69, ['A1'], 70)).toBeNull();
    });
});

// ─── calcRequeueInsertAt ─────────────────────────────────────────────────────

describe('calcRequeueInsertAt', () => {
    test('default offset is 3', () => {
        expect(calcRequeueInsertAt(2, 10)).toBe(5);
    });

    test('caps at quizLength when near end', () => {
        expect(calcRequeueInsertAt(8, 10)).toBe(10);
    });

    test('at last position: inserts at end', () => {
        expect(calcRequeueInsertAt(10, 10)).toBe(10);
    });

    test('respects custom offset', () => {
        expect(calcRequeueInsertAt(1, 20, 5)).toBe(6);
    });

    test('offset larger than remaining space: capped', () => {
        expect(calcRequeueInsertAt(9, 10, 5)).toBe(10);
    });
});

// ─── LEVEL_ORDER constant ────────────────────────────────────────────────────

describe('LEVEL_ORDER', () => {
    test('contains expected levels in order', () => {
        expect(LEVEL_ORDER).toEqual(['Beginner', 'A1', 'A2', 'B1', 'B2']);
    });
});
