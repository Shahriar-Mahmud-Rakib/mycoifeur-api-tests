// @ts-check
require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    // testIgnore: '**/exhaustive-suite/**',
    timeout: 60000,       // 60s per test (security/brute-force tests need more time)
    retries: 0,
    workers: 2,           // Reduced to 2 to avoid rate-limiting during security tests
    maxFailures: 0,       // Don't stop after any failures — run all tests
    reporter: [
        ['list'],
        ['allure-playwright', {
            detail: true,
            outputFolder: 'allure-results',
            suiteTitle: false
        }],
        ['html']
    ],
    use: {
        baseURL: process.env.BASE_URL || 'https://zk2a6jfr01.execute-api.ap-southeast-5.amazonaws.com',
        extraHTTPHeaders: {
            'x-custom-lang': process.env.CUSTOM_LANG || 'en',
            'x-app-version': process.env.APP_VERSION || '1.1.9',
            'x-platform': process.env.PLATFORM || 'android',
        },
        // API-only tests do not need browser artifacts
        screenshot: 'off',
        video: 'off',
        trace: 'off',
    },
});

