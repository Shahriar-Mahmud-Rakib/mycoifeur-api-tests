// ============================================
// Social Login API Tests
// ============================================
// Google:   POST /api/v1/auth/google/login
// Facebook: POST /api/v1/auth/facebook/login
// Apple:    POST /api/v1/auth/apple/login
// Body: { token: "..." }
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

test.describe('Google Login API Tests', () => {

    test('TC-01: Should reject Google login with missing token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/google/login`, {
            headers: MOBILE_HEADERS,
            data: {}
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Missing Google token rejected, status:', response.status(), json.message);
    });

    test('TC-02: Should reject Google login with invalid token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/google/login`, {
            headers: MOBILE_HEADERS,
            data: { token: 'invalid_google_token_xyz_123' }
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Invalid Google token rejected, status:', response.status(), json.message);
    });

    test('TC-03: Should reject Google login with empty token string', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/google/login`, {
            headers: MOBILE_HEADERS,
            data: { token: '' }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Empty Google token rejected, status:', response.status());
    });
});

test.describe('Facebook Login API Tests', () => {

    test('TC-04: Should reject Facebook login with missing token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/facebook/login`, {
            headers: MOBILE_HEADERS,
            data: {}
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Missing Facebook token rejected, status:', response.status(), json.message);
    });

    test('TC-05: Should reject Facebook login with invalid token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/facebook/login`, {
            headers: MOBILE_HEADERS,
            data: { token: 'invalid_facebook_token_xyz_123' }
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Invalid Facebook token rejected, status:', response.status(), json.message);
    });

    test('TC-06: Should reject Facebook login with null token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/facebook/login`, {
            headers: MOBILE_HEADERS,
            data: { token: null }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Null Facebook token rejected, status:', response.status());
    });
});

test.describe('Apple Login API Tests', () => {

    test('TC-07: Should reject Apple login with missing token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/apple/login`, {
            headers: MOBILE_HEADERS,
            data: {}
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Missing Apple token rejected, status:', response.status(), json.message);
    });

    test('TC-08: Should reject Apple login with invalid token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/apple/login`, {
            headers: MOBILE_HEADERS,
            data: { token: 'invalid_apple_token_xyz_123' }
        });
        expect(response.status()).not.toBe(200);
        const json = await response.json();
        console.log('✅ Invalid Apple token rejected, status:', response.status(), json.message);
    });

    test('TC-09: Should reject Apple login with empty body', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/apple/login`, {
            headers: MOBILE_HEADERS,
            data: {}
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Empty body Apple login rejected, status:', response.status());
    });
});
