/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/unit/**/*.test.js'],
    verbose: true,
    collectCoverageFrom: ['quiz/js_src/logic.js'],
    coverageThreshold: {
        global: { lines: 90, functions: 90 },
    },
};
