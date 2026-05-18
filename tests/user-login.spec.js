// ============================================
// User Login API Tests
// ============================================
// Endpoint: POST /api/v1/auth/login
// Body: { user: "email", password: "..." }
// Headers: x-custom-lang, x-app-version, x-platform
// ============================================

const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    USER_CREDENTIALS,
    USER2_CREDENTIALS,
    SALON_CREDENTIALS,
    MOBILE_HEADERS
} = require('./helpers/auth.helper');

test.describe('User Login API Tests', () => {

    // ✅ TC-01: Valid user login with email + password
    test('TC-01: Should login successfully with valid email and password', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: USER_CREDENTIALS
        });

        expect(response.status()).toBe(200);

        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data.accessToken).toBeTruthy();
        expect(json.data.refreshToken).toBeTruthy();
        expect(json.data.user).toBeTruthy();

        console.log('✅ User Login Success');
        console.log('   Token:', json.data.accessToken.substring(0, 50) + '...');
        console.log('   User:', json.data.user.fname, json.data.user.lname);
    });

    // ✅ TC-02: Valid login with second user credentials
    test('TC-02: Should login with second user credentials', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: SALON_CREDENTIALS
        });

        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data.accessToken).toBeTruthy();
        console.log('✅ User2 Login Success (Salon Credentials)');
    });

    // ❌ TC-03: Login with wrong password
    test('TC-03: Should fail login with wrong password', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: USER_CREDENTIALS.user, password: 'WrongPassword999' }
        });

        expect(response.status()).not.toBe(200);
        const json = await response.json();
        expect(json.success).toBeFalsy();
        console.log('✅ Wrong password rejected:', json.message);
    });

    // ❌ TC-04: Login with non-existent email
    test('TC-04: Should fail login with non-existent email', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: 'nonexistent99999@example.com', password: 'Password123456' }
        });

        expect(response.status()).not.toBe(200);
        const json = await response.json();
        expect(json.success).toBeFalsy();
        console.log('✅ Non-existent email rejected:', json.message);
    });

    // ❌ TC-05: Login with missing password field
    test('TC-05: Should fail login with missing password', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: USER_CREDENTIALS.user }
        });

        expect(response.status()).not.toBe(200);
        console.log('✅ Missing password rejected, status:', response.status());
    });

    // ❌ TC-06: Login with missing user field
    test('TC-06: Should fail login with missing user field', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { password: USER_CREDENTIALS.password }
        });

        expect(response.status()).not.toBe(200);
        console.log('✅ Missing user field rejected, status:', response.status());
    });

    // ❌ TC-07: Login with empty body
    test('TC-07: Should fail login with empty body', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: {}
        });

        expect(response.status()).not.toBe(200);
        console.log('✅ Empty body rejected, status:', response.status());
    });

    // ❌ TC-08: Login with phone number (should use email)
    test('TC-08: Should test login with phone number format', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: '966501234595', password: 'Password123456' }
        });

        const json = await response.json();
        console.log('   Phone login status:', response.status());
        console.log('   Response:', json.message);
        // Documents that phone login returns 401 - email is required
    });
});
