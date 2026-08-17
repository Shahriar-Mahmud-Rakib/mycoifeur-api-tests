// ============================================
// Full Suite: Auth Tests (Exhaustive DDT)
// Module: User Auth, Admin Auth
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('../helpers/auth.helper');
const { generatePhone } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🔐 Auth - User Auth', () => {

    let testPhone, testEmail, testToken, resetToken;

    test.beforeAll(() => {
        testPhone = generatePhone();
        testEmail = `auth_test_${Date.now()}@testmail.com`;
    });

    // ---- Registration (Happy Path) ----
    test('TC-AUTH-01: Register new user', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: {
                email: testEmail, password: 'Password123456',
                fname: 'Auth', lname: 'Test',
                phone: testPhone, type_user: 'user',
                country_id: '1', city_id: '1',
            }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json();
        expect(json.success).toBe(true);
    });

    // ---- Exhaustive Validation for Registration ----
    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-AUTH-REG-VAL-${key}: Register with invalid email (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
                headers: MOBILE_HEADERS,
                multipart: {
                    email: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '', 
                    password: 'Password123456',
                    fname: 'Auth', lname: 'Test', phone: generatePhone(), type_user: 'user', country_id: '1', city_id: '1',
                }
            });
            expect([400, 422]).toContain(res.status());
        });
    }

    // ---- Exhaustive Security for Registration ----
    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-AUTH-REG-SEC-${key}: Register SQLi/XSS in fname (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
                headers: MOBILE_HEADERS,
                multipart: {
                    email: `sec_${Date.now()}@test.com`, password: 'Password123456',
                    fname: typeof payload.val === 'string' ? payload.val : 'Test', 
                    lname: 'User', phone: generatePhone(), type_user: 'user', country_id: '1', city_id: '1',
                }
            });
            // Should either block (400/422) or sanitize and create (200/201), but NEVER 500 error
            expect([200, 201, 400, 422, 403]).toContain(res.status());
        });
    }

    test('TC-AUTH-02: Register with duplicate email → 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: {
                email: testEmail, password: 'Password123456',
                fname: 'Dup', lname: 'User', phone: generatePhone(),
                type_user: 'user', country_id: '1', city_id: '1',
            }
        });
        expect([400, 409, 422]).toContain(res.status());
    });

    // ---- OTP ----
    test('TC-AUTH-03: Send OTP to registered phone', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, countryCode: '966', typeUser: 'user' }
        });
        expect([200, 429]).toContain(res.status()); // 429 = rate limited (ok)
    });

    test('TC-AUTH-04: Verify OTP and get token', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, code: '1234', typeUser: 'user', countryCode: '966' }
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.data?.accessToken).toBeDefined();
        testToken = json.data.accessToken;
    });

    // ---- Validation for OTP ----
    test('TC-AUTH-05: Verify OTP with wrong code → 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, code: '9999', typeUser: 'user', countryCode: '966' }
        });
        expect([400, 422]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-AUTH-OTP-VAL-${key}: Send OTP invalid phone (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
                headers: MOBILE_HEADERS,
                data: { phone: payload.val, countryCode: '966', typeUser: 'user' }
            });
            expect([400, 404, 422]).toContain(res.status());
        });
    }

    test('TC-AUTH-06: Resend OTP', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/resend-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, typeUser: 'user', countryCode: '966' }
        });
        expect([200, 400, 429]).toContain(res.status());
    });

    // ---- Login ----
    test('TC-AUTH-07: Login with email+password', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: testEmail, password: 'Password123456' }
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.data?.accessToken).toBeDefined();
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-AUTH-LOGIN-VAL-${key}: Login with invalid password (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
                headers: MOBILE_HEADERS,
                data: { user: testEmail, password: payload.val }
            });
            expect([400, 401, 422, 404]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-AUTH-LOGIN-SEC-${key}: Login with SQLi in user (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
                headers: MOBILE_HEADERS,
                data: { user: payload.val, password: 'Password123456' }
            });
            expect([400, 401, 404, 422, 403]).toContain(res.status());
        });
    }

    // ---- Token RBAC & Validation ----
    test('TC-AUTH-09: Refresh token', async ({ request }) => {
        if (!testToken) { test.skip(); return; }
        const res = await request.post(`${BASE_URL}/api/v1/auth/refresh`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testToken}` }
        });
        expect([200, 401]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-AUTH-RBAC-01: Profile with ${auth.name} → 401`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/user/profile`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    // ---- Admin Auth ----
    test('TC-AUTH-12: Admin login with valid credentials', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            headers: { 'x-custom-lang': 'en' },
            data: { user: 'amrmuhamed9@gmail.com', password: '123456' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-AUTH-ADMIN-SEC-${key}: Admin login SQLi (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
                headers: { 'x-custom-lang': 'en' },
                data: { user: payload.val, password: 'Password123456' }
            });
            expect([400, 401, 404, 422, 403]).toContain(res.status());
        });
    }
});
