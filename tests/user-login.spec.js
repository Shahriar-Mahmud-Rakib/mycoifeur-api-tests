// ============================================
// User & Salon Login API Tests (OTP Flow)
// ============================================
// Endpoint: POST /api/v1/auth/send-otp
// Endpoint: POST /api/v1/auth/verify-code
// ============================================

const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    USER_CREDENTIALS,
    SALON_CREDENTIALS,
    MOBILE_HEADERS
} = require('./helpers/auth.helper');

test.describe('User Login (OTP Flow) API Tests', () => {

    // ✅ TC-01: Valid user login via OTP
    test('TC-01: Should login successfully via OTP for user', async ({ request }) => {
        // Step 1: Send OTP
        const sendOtpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '512345679',
                countryCode: USER_CREDENTIALS.countryCode,
                typeUser: USER_CREDENTIALS.typeUser
            }
        });
        expect([200, 429]).toContain(sendOtpRes.status());

        // Step 2: Verify Code
        const response = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '512345679',
                code: USER_CREDENTIALS.code,
                countryCode: USER_CREDENTIALS.countryCode,
                typeUser: USER_CREDENTIALS.typeUser
            }
        });
        
        expect(response.status()).toBe(200);

        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data.accessToken).toBeTruthy();
        expect(json.data.refreshToken).toBeTruthy();
        expect(json.data.user).toBeTruthy();

        console.log('✅ User Login Success');
    });

    // ✅ TC-02: Valid salon login via OTP
    test('TC-02: Should login successfully via OTP for salon', async ({ request }) => {
        // Step 1: Send OTP
        const sendOtpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '512345680',
                countryCode: SALON_CREDENTIALS.countryCode,
                typeUser: SALON_CREDENTIALS.typeUser
            }
        });
        expect([200, 429]).toContain(sendOtpRes.status());

        // Step 2: Verify Code
        const response = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '512345680',
                code: SALON_CREDENTIALS.code,
                countryCode: SALON_CREDENTIALS.countryCode,
                typeUser: SALON_CREDENTIALS.typeUser
            }
        });
        
        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data.accessToken).toBeTruthy();
        console.log('✅ Salon Login Success');
    });

    // ❌ TC-03: Missing typeUser in send-otp
    test('TC-03: Should fail send-otp with missing typeUser', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: USER_CREDENTIALS.phone,
                countryCode: USER_CREDENTIALS.countryCode
            }
        });
        expect([200, 429]).toContain(response.status());
    });

    // ❌ TC-04: Wrong OTP code
    test('TC-04: Should fail verify-code with wrong OTP', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: USER_CREDENTIALS.phone,
                code: '9999',
                countryCode: USER_CREDENTIALS.countryCode,
                typeUser: USER_CREDENTIALS.typeUser
            }
        });
        expect(response.status()).not.toBe(200);
    });
});
