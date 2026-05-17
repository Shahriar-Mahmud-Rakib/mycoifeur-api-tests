// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 60000,       // 60s per test (security/brute-force tests need more time)
    retries: 0,
    workers: 2,           // Reduced to 2 to avoid rate-limiting during security tests
    reporter: [['html'], ['list']],
    use: {
        baseURL: 'https://dev-api.mycoifeur.com.sa',
        extraHTTPHeaders: {
            'x-custom-lang': 'en',
            'x-app-version': '1.1.4',
            'x-platform': 'android',
        },
        // Automatic SQA Visual Diagnostics on Failure
        screenshot: 'only-on-failure', // Take screenshots on failure
        video: 'retain-on-failure',     // Record video of browser on failure
        trace: 'retain-on-failure',     // Capture interactive trace logs on failure
    },
});
