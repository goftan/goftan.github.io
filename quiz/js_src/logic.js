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
// Spaced Repetition System (SM-2 algorithm)
// ---------------------------------------------------------------------------

/**
 * Updates a card's SRS state after a review.
 * @param {object} card  — { interval, easeFactor, repetitions } (may be {})
 * @param {number} grade — 0–5 (0=complete blackout, 5=perfect)
 * @returns new card state (does NOT mutate input)
 */
function sm2Update(card, grade) {
    var c = Object.assign({ interval: 1, easeFactor: 2.5, repetitions: 0 }, card);
    if (grade >= 3) {
        if (c.repetitions === 0)      c.interval = 1;
        else if (c.repetitions === 1) c.interval = 6;
        else                          c.interval = Math.round(c.interval * c.easeFactor);
        c.repetitions++;
    } else {
        c.repetitions = 0;
        c.interval = 1;
    }
    c.easeFactor = Math.max(1.3, c.easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    var now = new Date();
    var due = new Date(now.getTime() + c.interval * 86400000);
    c.dueDate = due.toDateString();
    return c;
}

/**
 * Returns only the cards that are due today or overdue.
 * @param {object} deck — { [word]: cardState }
 * @param {string} today — new Date().toDateString()
 */
function getDueCards(deck, today) {
    var todayMs = new Date(today).getTime();
    return Object.keys(deck).filter(function(word) {
        var due = deck[word].dueDate;
        if (!due) return true; // never reviewed
        return new Date(due).getTime() <= todayMs;
    });
}

// ---------------------------------------------------------------------------
// Milestone badges
// ---------------------------------------------------------------------------

var BADGES = [
    { id: 'first_quiz',     label: 'First Steps',       icon: '🎯', desc: 'Complete your first quiz',            check: function(s) { return s.totalSessions >= 1; } },
    { id: 'perfect_score',  label: 'Perfect Score',     icon: '💯', desc: 'Score 100% on any quiz',              check: function(s) { return s.lastPct === 100; } },
    { id: 'streak_3',       label: 'On Fire',           icon: '🔥', desc: 'Reach a 3-day streak',                check: function(s) { return s.streak >= 3; } },
    { id: 'streak_7',       label: 'Dedicated',         icon: '📅', desc: 'Reach a 7-day streak',                check: function(s) { return s.streak >= 7; } },
    { id: 'streak_30',      label: 'Unstoppable',       icon: '🏆', desc: 'Reach a 30-day streak',               check: function(s) { return s.streak >= 30; } },
    { id: 'xp_100',         label: 'Vocab Builder',     icon: '⚡', desc: 'Earn 100 XP total',                   check: function(s) { return s.xp >= 100; } },
    { id: 'xp_500',         label: 'Scholar',           icon: '📚', desc: 'Earn 500 XP total',                   check: function(s) { return s.xp >= 500; } },
    { id: 'xp_2000',        label: 'Language Master',   icon: '🌍', desc: 'Earn 2000 XP total',                  check: function(s) { return s.xp >= 2000; } },
    { id: 'high_score_90',  label: 'Top Student',       icon: '🌟', desc: 'Score 90% or above',                  check: function(s) { return s.lastPct >= 90; } },
    { id: 'sessions_10',    label: 'Regular',           icon: '🗓', desc: 'Complete 10 quiz sessions',           check: function(s) { return s.totalSessions >= 10; } },
    { id: 'sessions_50',    label: 'Veteran',           icon: '🎖', desc: 'Complete 50 quiz sessions',           check: function(s) { return s.totalSessions >= 50; } },
];

/**
 * Returns array of newly-earned badge ids given current stats.
 * @param {object} stats    — { streak, xp, lastPct, totalSessions }
 * @param {string[]} earned — badge ids already awarded
 */
function checkNewBadges(stats, earned) {
    var alreadyEarned = earned || [];
    return BADGES.filter(function(b) {
        return !alreadyEarned.includes(b.id) && b.check(stats);
    }).map(function(b) { return b.id; });
}

// ---------------------------------------------------------------------------
// Topic mastery tracking
// ---------------------------------------------------------------------------

/**
 * Updates per-topic accuracy record.
 * @param {object} stored    — { [topic]: { correct, total } }
 * @param {object[]} wrongs  — array of { _topic }
 * @param {number} total     — total questions answered
 * @param {string[]} topics  — all topics attempted this session
 * @returns updated object (does NOT mutate stored)
 */
function updateTopicMastery(stored, wrongs, total, topics) {
    var updated = Object.assign({}, stored);
    // Mark all attempted topics
    topics.forEach(function(t) {
        if (!updated[t]) updated[t] = { correct: 0, total: 0 };
    });
    // Count per-topic wrong answers
    var wrongCounts = {};
    (wrongs || []).forEach(function(w) {
        var t = w._topic || 'Unknown';
        wrongCounts[t] = (wrongCounts[t] || 0) + 1;
    });
    // Distribute correct counts (approximate: total - wrong per topic)
    topics.forEach(function(t) {
        var wrong = wrongCounts[t] || 0;
        // Each topic contributes proportionally to total (simple approximation)
        var topicTotal = Math.round(total / topics.length);
        var topicCorrect = Math.max(0, topicTotal - wrong);
        updated[t].total   += topicTotal;
        updated[t].correct += topicCorrect;
    });
    return updated;
}

/**
 * Returns mastery percentage (0–100) for a topic.
 */
function getTopicMasteryPct(topicData) {
    if (!topicData || topicData.total === 0) return null;
    return Math.round((topicData.correct / topicData.total) * 100);
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
        sm2Update,
        getDueCards,
        BADGES,
        checkNewBadges,
        updateTopicMastery,
        getTopicMasteryPct,
    };
}
