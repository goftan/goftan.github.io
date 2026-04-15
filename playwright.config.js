const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: 'tests/e2e',
    timeout: 30000,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,

    use: {
        baseURL: 'http://localhost:8080',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Give d3.json() loads time to settle
        actionTimeout: 8000,
        navigationTimeout: 15000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
    ],

    webServer: {
        // Serve the repo root so /quiz/ resolves to quiz/index.html
        // -c-1 disables caching so test runs always see the latest files
        command: 'npx http-server . -p 8080 --cors -c-1 -s',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 10000,
    },
});
