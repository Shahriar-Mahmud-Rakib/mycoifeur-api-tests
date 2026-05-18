// @ts-check
require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testIgnore: '**/exhaustive-suite/**',
    timeout: 60000,       // 60s per test (security/brute-force tests need more time)
    retries: 0,
    workers: 2,           // Reduced to 2 to avoid rate-limiting during security tests
    globalTeardown: require.resolve('./tests/global.teardown.js'),
    reporter: [['html'], ['list']],
    use: {
        baseURL: process.env.BASE_URL || 'https://dev-api.mycoifeur.com.sa',
        extraHTTPHeaders: {
            'x-custom-lang': process.env.CUSTOM_LANG || 'en',
            'x-app-version': process.env.APP_VERSION || '1.1.4',
            'x-platform': process.env.PLATFORM || 'android',
        },
        // Automatic SQA Visual Diagnostics (Always record for rich reports)
        screenshot: 'on', // Always take screenshots of steps
        video: 'on',      // Always record video of browser execution
        trace: 'on',      // Always capture interactive trace logs
    },
});
