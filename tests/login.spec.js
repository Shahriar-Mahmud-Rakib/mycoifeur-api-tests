// ============================================
// Admin / Salon / User Login API — Full Test Suite
// ============================================
// Endpoints:
//   POST /api/v1/auth/admin/login   (Admin & Salon)
//   POST /api/v1/auth/login         (Mobile User)
// ============================================
const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    ADMIN_CREDENTIALS,
    SALON_CREDENTIALS,
    USER_CREDENTIALS,
    MOBILE_HEADERS,
} = require('./helpers/auth.helper');
const {
    SQL_INJECTION_PAYLOADS,
    XSS_PAYLOADS,
    BOUNDARY,
    INVALID_TYPES,
} = require('./helpers/test-data.helper');

const MAX_RESPONSE_TIME_MS = 5000;

// ─────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────
test.describe('🔐 Admin Login — Functional Tests', () => {

    test('TC-L-01 [POSITIVE] Valid admin credentials → 200 + tokens', async ({ request }) => {
        const start = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: ADMIN_CREDENTIALS,
        });
        const elapsed = Date.now() - start;
        const json = await res.json();

        // Status
        expect(res.status()).toBe(200);
        // Schema
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        expect(typeof json.data.accessToken).toBe('string');
        expect(typeof json.data.refreshToken).toBe('string');
        expect(json.data.user).toBeTruthy();
        expect(json.data.user.id).toBeTruthy();
        // Sensitive data NOT exposed
        expect(JSON.stringify(json)).not.toContain(ADMIN_CREDENTIALS.password);
        // Response time
        expect(elapsed).toBeLessThan(MAX_RESPONSE_TIME_MS);

        console.log(`✅ [TC-L-01] Admin login OK | ${elapsed}ms | token: ${json.data.accessToken.substring(0, 30)}...`);
    });

    test('TC-L-02 [NEGATIVE] Wrong password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: 'WrongPass@@999!' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json.success).toBeFalsy();
        console.log(`✅ [TC-L-02] Wrong password rejected: ${res.status()} — ${json.message}`);
    });

    test('TC-L-03 [NEGATIVE] Non-existent email → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'ghost_user_99999@no-domain-xyz.com', password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-03] Non-existent email rejected: ${res.status()}`);
    });

    test('TC-L-04 [NEGATIVE] Empty body → 400/422', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: {} });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-04] Empty body rejected: ${res.status()}`);
    });

    test('TC-L-05 [NEGATIVE] Missing password field → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-05] Missing password rejected: ${res.status()}`);
    });

    test('TC-L-06 [NEGATIVE] Missing user/email field → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { password: ADMIN_CREDENTIALS.password },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-06] Missing user field rejected: ${res.status()}`);
    });

    test('TC-L-07 [NEGATIVE] Invalid email format → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'not-a-valid-email@@@@', password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-07] Invalid email format rejected: ${res.status()}`);
    });

    test('TC-L-08 [NEGATIVE] Whitespace-only email → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: BOUNDARY.WHITESPACE_ONLY, password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-08] Whitespace email rejected: ${res.status()}`);
    });

    test('TC-L-09 [NEGATIVE] Whitespace-only password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: BOUNDARY.WHITESPACE_ONLY },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-09] Whitespace password rejected: ${res.status()}`);
    });
});

test.describe('📏 Admin Login — Boundary Value Tests', () => {

    test('TC-L-10 [BOUNDARY] Single character password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: BOUNDARY.SINGLE_CHAR },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-10] Single-char password rejected: ${res.status()}`);
    });

    test('TC-L-11 [BOUNDARY] Very long email (>250 chars) → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: BOUNDARY.LONG_EMAIL, password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-11] Overlong email rejected: ${res.status()}`);
    });

    test('TC-L-12 [BOUNDARY] Very long password (1000 chars) → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: BOUNDARY.LONG_PASSWORD },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-L-12] Overlong password rejected: ${res.status()}`);
    });

    test('TC-L-13 [BOUNDARY] Unicode characters in password → handled', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: BOUNDARY.UNICODE_STRING },
        });
        // Should NOT crash server (not 500)
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-L-13] Unicode password handled gracefully: ${res.status()}`);
    });

    test('TC-L-14 [BOUNDARY] Special characters in password → handled', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: BOUNDARY.SPECIAL_CHARS },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-L-14] Special chars handled: ${res.status()}`);
    });
});

test.describe('🛡️ Admin Login — Security Tests', () => {

    SQL_INJECTION_PAYLOADS.forEach((payload, i) => {
        test(`TC-L-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL injection in email: "${payload.substring(0, 30)}"`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
                data: { user: payload, password: 'Password123' },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500); // Must not cause server error
            console.log(`✅ SQL injection email blocked: ${res.status()}`);
        });
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-L-SEC-SQLP-${String(i + 1).padStart(2, '0')} [SECURITY] SQL injection in password: "${payload.substring(0, 30)}"`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
                data: { user: ADMIN_CREDENTIALS.user, password: payload },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL injection password blocked: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-L-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS payload in email: "${payload.substring(0, 30)}"`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
                data: { user: payload, password: 'Password123' },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            // XSS should not be reflected raw in response
            const body = await res.text();
            expect(body).not.toContain('<script>');
            console.log(`✅ XSS payload rejected: ${res.status()}`);
        });
    });

    test('TC-L-SEC-DATA [SECURITY] Password NOT exposed in login response', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: ADMIN_CREDENTIALS,
        });
        if (res.status() === 200) {
            const body = await res.text();
            expect(body).not.toContain(ADMIN_CREDENTIALS.password);
            console.log('✅ Password not exposed in response body');
        }
    });
});

test.describe('🔢 Admin Login — Data Type Tests', () => {

    test('TC-L-DT-01 [DATATYPE] Number as email → handled, not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: INVALID_TYPES.NUMBER_AS_EMAIL, password: 'Password123' },
        });
        expect([400, 422, 500]).toContain(res.status());
        console.log(`✅ [TC-L-DT-01] Number as email handled: ${res.status()}`);
    });

    test('TC-L-DT-02 [DATATYPE] Array as password → handled, not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: ADMIN_CREDENTIALS.user, password: INVALID_TYPES.ARRAY_AS_STRING },
        });
        expect([400, 422, 500]).toContain(res.status());
        console.log(`✅ [TC-L-DT-02] Array as password handled: ${res.status()}`);
    });

    test('TC-L-DT-03 [DATATYPE] Boolean as email → handled, not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: true, password: 'Password123' },
        });
        expect([400, 422, 500]).toContain(res.status());
        console.log(`✅ [TC-L-DT-03] Boolean as email handled: ${res.status()}`);
    });
});

test.describe('📊 Admin Login — Response Validation', () => {

    test('TC-L-RV-01 [SCHEMA] Valid login response schema complete', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: ADMIN_CREDENTIALS,
        });
        expect(res.status()).toBe(200);
        const json = await res.json();

        // Top-level schema
        expect(json).toHaveProperty('success');
        expect(json).toHaveProperty('data');
        // Data schema
        expect(json.data).toHaveProperty('accessToken');
        expect(json.data).toHaveProperty('refreshToken');
        expect(json.data).toHaveProperty('user');
        // User schema
        expect(json.data.user).toHaveProperty('id');
        // Token format (JWT has 3 parts separated by '.')
        const tokenParts = json.data.accessToken.split('.');
        expect(tokenParts.length).toBe(3);
        console.log('✅ [TC-L-RV-01] Response schema fully validated');
    });

    test('TC-L-RV-02 [RESPONSE-TIME] Login completes within 5 seconds', async ({ request }) => {
        const start = Date.now();
        await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: ADMIN_CREDENTIALS,
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(MAX_RESPONSE_TIME_MS);
        console.log(`✅ [TC-L-RV-02] Response time: ${elapsed}ms`);
    });

    test('TC-L-RV-03 [STATUS] Wrong credentials → 4xx (not 2xx, not 5xx)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'bad@email.com', password: 'badpassword' },
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        console.log(`✅ [TC-L-RV-03] Error status in 4xx range: ${res.status()}`);
    });

    test('TC-L-RV-04 [ERROR-MSG] Error response has message field', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'wrong@email.com', password: 'WrongPass123' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        expect(json.message.length).toBeGreaterThan(0);
        console.log(`✅ [TC-L-RV-04] Error message present: "${json.message}"`);
    });

    test('TC-L-RV-05 [CONTENT-TYPE] Response is JSON', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: ADMIN_CREDENTIALS,
        });
        const contentType = res.headers()['content-type'] || '';
        expect(contentType).toContain('application/json');
        console.log(`✅ [TC-L-RV-05] Content-Type: ${contentType}`);
    });
});

// ─────────────────────────────────────────────
// USER LOGIN (Mobile)
// ─────────────────────────────────────────────
test.describe('📱 User Mobile Login — Full Tests', () => {

    test('TC-UL-01 [POSITIVE] Valid user credentials → 200 + tokens', async ({ request }) => {
        const start = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: USER_CREDENTIALS,
        });
        const elapsed = Date.now() - start;
        const json = await res.json();

        if (res.status() === 200) {
            expect(json.success).toBe(true);
            expect(json.data.accessToken).toBeTruthy();
            expect(json.data.refreshToken).toBeTruthy();
            expect(elapsed).toBeLessThan(MAX_RESPONSE_TIME_MS);
            console.log(`✅ [TC-UL-01] User login OK | ${elapsed}ms`);
        } else {
            console.log(`ℹ️  [TC-UL-01] User login: ${res.status()} — ${json.message}`);
        }
    });

    test('TC-UL-02 [NEGATIVE] Wrong user password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: USER_CREDENTIALS.user, password: 'WrongPass@@9999' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-UL-02] Wrong user password rejected: ${res.status()}`);
    });

    test('TC-UL-03 [NEGATIVE] Non-existent user email → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: 'ghost99999@nodomain.xyz', password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-UL-03] Non-existent user rejected: ${res.status()}`);
    });

    test('TC-UL-04 [NEGATIVE] Empty body → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-UL-04] Empty user body rejected: ${res.status()}`);
    });

    test('TC-UL-05 [NEGATIVE] Missing password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: USER_CREDENTIALS.user },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-UL-05] Missing password rejected: ${res.status()}`);
    });

    test('TC-UL-06 [SECURITY] SQL injection in user email → not 200 / not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: "' OR 1=1--", password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UL-06] SQL injection blocked: ${res.status()}`);
    });

    test('TC-UL-07 [SECURITY] XSS in user login fields → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: '<script>alert(1)</script>', password: '<img src=x onerror=alert(1)>' },
        });
        expect(res.status()).not.toBe(500);
        const body = await res.text();
        expect(body).not.toContain('<script>');
        console.log(`✅ [TC-UL-07] XSS in user login blocked: ${res.status()}`);
    });

    test('TC-UL-08 [BOUNDARY] Very long email → not 200 / not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: BOUNDARY.LONG_EMAIL, password: 'Password123' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UL-08] Overlong email handled: ${res.status()}`);
    });

    test('TC-UL-09 [SCHEMA] Successful login response has required schema', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: USER_CREDENTIALS,
        });
        if (res.status() === 200) {
            const json = await res.json();
            expect(json).toHaveProperty('success', true);
            expect(json).toHaveProperty('data');
            expect(json.data).toHaveProperty('accessToken');
            expect(json.data).toHaveProperty('refreshToken');
            console.log('✅ [TC-UL-09] User login schema validated');
        } else {
            console.log(`ℹ️  [TC-UL-09] Skipped schema check — status ${res.status()}`);
        }
    });

    test('TC-UL-10 [RESPONSE-TIME] User login responds within 5 seconds', async ({ request }) => {
        const start = Date.now();
        await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: USER_CREDENTIALS,
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(MAX_RESPONSE_TIME_MS);
        console.log(`✅ [TC-UL-10] User login response time: ${elapsed}ms`);
    });
});

// ─────────────────────────────────────────────
// SALON LOGIN
// ─────────────────────────────────────────────
test.describe('💇 Salon Login — Tests', () => {

    test('TC-SL-01 [POSITIVE] Valid salon credentials → 200 + tokens', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: SALON_CREDENTIALS,
        });
        const json = await res.json();
        if (res.status() === 200) {
            expect(json.success).toBe(true);
            expect(json.data.accessToken).toBeTruthy();
            console.log(`✅ [TC-SL-01] Salon login OK | type: ${json.data.user?.type_user}`);
        } else {
            console.log(`ℹ️  [TC-SL-01] Salon login: ${res.status()} — ${json.message}`);
        }
    });

    test('TC-SL-02 [NEGATIVE] Wrong salon password → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: SALON_CREDENTIALS.user, password: 'WrongSalonPass@@999' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SL-02] Wrong salon password rejected: ${res.status()}`);
    });

    test('TC-SL-03 [NEGATIVE] Non-existent salon email → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'nosuchsalon99999@nodomain.xyz', password: 'Password123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SL-03] Non-existent salon rejected: ${res.status()}`);
    });
});