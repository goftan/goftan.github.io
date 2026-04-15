/**
 * logic.js — pure, DOM-free functions that can be unit-tested in Node.
 *
 * Each function takes plain data in and returns plain data out.
 * No localStorage reads/writes, no d3 calls, no document access.
 *
 * The final block exports everything for Jest while still making all
 * functions available as browser globals when loaded as a plain <script>.
 */

// ---------------------------------------------------------------------------
// Array shuffling (Fisher-Yates)
// ---------------------------------------------------------------------------

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = array[i]; array[i] = array[j]; array[j] = tmp;
    }
    return array;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Returns { pct, skipped } from raw counts.
 * pct is 0–100 (rounded integer).  skipped is clamped to ≥ 0.
 */
function calcScore(correct, incorrect, total) {
    var pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    var skipped = Math.max(0, total - correct - incorrect);
    return { pct: pct, skipped: skipped };
}

function getGradeText(pct) {
    if (pct >= 90) return '🏆 Excellent!';
    if (pct >= 70) return '👍 Good job!';
    if (pct >= 50) return '📚 Keep practicing!';
    return '💪 Don\'t give up!';
}

// ---------------------------------------------------------------------------
// Score history
// ---------------------------------------------------------------------------

/**
 * Appends pct to the history array and returns the new array.
 * Caps at maxEntries (default 20). Does NOT mutate the input.
 */
function appendScoreHistory(history, pct, maxEntries) {
    var cap = maxEntries || 20;
    var updated = history.slice();
    updated.push(pct);
    if (updated.length > cap) updated = updated.slice(updated.length - cap);
    return updated;
}

/**
 * Returns the maximum value in the history array, or null if empty.
 */
function getPersonalBest(historyArray) {
    if (!historyArray || historyArray.length === 0) return null;
    return Math.max.apply(null, historyArray);
}

// ---------------------------------------------------------------------------
// Streak + XP
// ---------------------------------------------------------------------------

/**
 * Pure streak/XP calculation.
 *
 * @param {object} storedData  — { streak, lastPlayed, xp } from localStorage (may be {})
 * @param {string} today       — new Date().toDateString()
 * @param {string} yesterday   — new Date(Date.now() - 86400000).toDateString()
 * @param {number} correct     — number of correct answers this session
 * @returns new data object (does NOT mutate storedData)
 */
function calcStreakAndXP(storedData, today, yesterday, correct) {
    var data = Object.assign({}, storedData);
    if (data.lastPlayed === today) {
        // Already played today — streak stays the same
    } else if (data.lastPlayed === yesterday) {
        data.streak = (data.streak || 1) + 1;
    } else {
        data.streak = 1;
    }
    data.lastPlayed = today;
    var bonus = data.streak > 1 ? 50 : 0;
    data.earnedXP = correct * 10 + bonus;
    data.streakBonus = bonus;
    data.xp = (data.xp || 0) + data.earnedXP;
    return data;
}

// ---------------------------------------------------------------------------
// Weak topic detection
// ---------------------------------------------------------------------------

/**
 * Returns { topic, count } for the most-missed topic, or null if none.
 * 'Unknown' topics are ignored.
 */
function getWeakTopic(wrongAnswers) {
    if (!wrongAnswers || wrongAnswers.length === 0) return null;
    var counts = {};
    wrongAnswers.forEach(function(w) {
        var t = w._topic || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
    });
    var sorted = Object.keys(counts)
        .filter(function(k) { return k !== 'Unknown'; })
        .map(function(k) { return { topic: k, count: counts[k] }; })
        .sort(function(a, b) { return b.count - a.count; });
    return sorted.length > 0 ? sorted[0] : null;
}

// ---------------------------------------------------------------------------
// Difficulty nudge
// ---------------------------------------------------------------------------

var LEVEL_ORDER = ['Beginner', 'A1', 'A2', 'B1', 'B2'];

/**
 * Returns the next level above the highest selected one when score ≥ threshold,
 * or null if already at max / score too low.
 */
function getNextDifficultyLevel(pct, selectedLevels, threshold, levelOrder) {
    var minPct = threshold != null ? threshold : 85;
    var order  = levelOrder || LEVEL_ORDER;
    if (pct < minPct) return null;
    var highestIdx = -1;
    (selectedLevels || []).forEach(function(l) {
        var idx = order.indexOf(l);
        if (idx > highestIdx) highestIdx = idx;
    });
    if (highestIdx < 0 || highestIdx >= order.length - 1) return null;
    return order[highestIdx + 1];
}

// ---------------------------------------------------------------------------
// Re-queue
// ---------------------------------------------------------------------------

/**
 * Returns the index at which a re-queued question should be spliced in.
 * Places it `offset` positions ahead (default 3), capped at quizLength.
 */
function calcRequeueInsertAt(currentIndex, quizLength, offset) {
    return Math.min(currentIndex + (offset != null ? offset : 3), quizLength);
}

// ---------------------------------------------------------------------------
// Module export (Node/Jest) — does not affect browser globals
// ---------------------------------------------------------------------------

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
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
    };
}
