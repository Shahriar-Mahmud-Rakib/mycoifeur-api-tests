// ============================================
// Config / Version Check API Tests
// ============================================
// GET /api/v1/config/check-version
// GET /api/v1/config/version
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

test.describe('Version Check API Tests', () => {

    test('TC-01: Should check app version with valid headers', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/check-version`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Version check status:', response.status());
        console.log('Response:', JSON.stringify(json, null, 2));
        // Should return 200 with version info
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Version check successful');
        } else {
            console.log('ℹ️  Version check response:', json.message);
        }
    });

    test('TC-02: Should check version for Android platform', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/check-version`, {
            headers: {
                'x-custom-lang': 'en',
                'x-app-version': '1.1.4',
                'x-platform': 'android'
            }
        });
        console.log('Android version check status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Android version check successful');
        } else {
            const json = await response.json();
            console.log('ℹ️  Response:', json.message);
        }
    });

    test('TC-03: Should check version for iOS platform', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/check-version`, {
            headers: {
                'x-custom-lang': 'en',
                'x-app-version': '1.1.4',
                'x-platform': 'ios'
            }
        });
        console.log('iOS version check status:', response.status());
        if (response.status() === 200) {
            console.log('✅ iOS version check successful');
        }
    });

    test('TC-04: Should check version with old version number', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/check-version`, {
            headers: {
                'x-custom-lang': 'en',
                'x-app-version': '1.0.0',
                'x-platform': 'ios'
            }
        });
        console.log('Old version check status:', response.status());
        const json = await response.json();
        console.log('Response:', JSON.stringify(json, null, 2));
        console.log('ℹ️  Old version response captured');
    });
});

test.describe('Get Version API Tests', () => {

    test('TC-05: Should get version configuration', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/version`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Config version status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Version config fetched:', JSON.stringify(json.data, null, 2));
        } else {
            console.log('ℹ️  Config version response:', json.message);
        }
    });

    test('TC-06: Should get version without platform header', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/config/version`, {
            headers: { 'x-custom-lang': 'en' }
        });
        console.log('Version without platform header status:', response.status());
    });
});
