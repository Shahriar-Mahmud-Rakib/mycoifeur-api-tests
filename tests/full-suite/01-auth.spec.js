// ============================================
// Full Suite: Auth Tests (Exhaustive DDT)
// Module: User Auth, Admin Auth
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, ADMIN_CREDENTIALS } = require('../helpers/auth.helper');
const { generatePhone } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🔐 Auth - User Auth', () => {

    let testPhone, testToken;

    test.beforeAll(() => {
        testPhone = generatePhone();
    });

    // ---- Registration & OTP (Happy Path) ----
    test('TC-AUTH-01: Register & Send OTP to new phone', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: testPhone,
                countryCode: '966',
                typeUser: 'user'
            }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json();
        expect(json.success).toBe(true);
    });

    // ---- Exhaustive Validation for OTP ----
    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-AUTH-REG-VAL-${key}: Send OTP with invalid phone (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
                headers: MOBILE_HEADERS,
                data: {
                    phone: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    countryCode: '966',
                    typeUser: 'user'
                }
            });
            expect(res.status()).toBeGreaterThanOrEqual(400);
        });
    }

    // ---- Exhaustive Security for OTP ----
    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-AUTH-REG-SEC-${key}: Send OTP SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
                headers: MOBILE_HEADERS,
                data: {
                    phone: typeof payload.val === 'string' ? payload.val : '966550000000',
                    countryCode: '966',
                    typeUser: 'user'
                }
            });
            expect(res.status()).not.toBe(500);
        });
    }

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

    test('TC-AUTH-05: Verify OTP with wrong code → 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, code: '9999', typeUser: 'user', countryCode: '966' }
        });
        expect([400, 422]).toContain(res.status());
    });

    test('TC-AUTH-06: Resend OTP', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/resend-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: testPhone, typeUser: 'user', countryCode: '966' }
        });
        expect([200, 400, 429]).toContain(res.status());
    });

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
            data: ADMIN_CREDENTIALS
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.data?.accessToken).toBeDefined();
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-AUTH-ADMIN-SEC-${key}: Admin login SQLi (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
                headers: { 'x-custom-lang': 'en' },
                data: { user: typeof payload.val === 'string' ? payload.val : 'admin@test.com', password: 'Password123456' }
            });
            expect([400, 401, 404, 422, 403]).toContain(res.status());
        });
    }
});
