// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './',
    timeout: 30000,
    retries: 0,
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],
    use: {
        baseURL: 'https://dev-api.mycoifeur.com.sa',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
        },
    },
});
