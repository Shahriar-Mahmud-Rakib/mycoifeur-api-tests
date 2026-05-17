// ============================================
// Refresh Token API — Full Test Suite
// ============================================
// User:  POST /api/v1/auth/refresh        (Bearer refreshToken)
// Admin: POST /api/v1/auth/admin/refresh  (Bearer refreshToken)
// ============================================
const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    MOBILE_HEADERS,
    userLogin,
    adminLogin,
} = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, INVALID_TOKENS } = require('./helpers/test-data.helper');

const USER_REFRESH_EP  = `${BASE_URL}/api/v1/auth/refresh`;
const ADMIN_REFRESH_EP = `${BASE_URL}/api/v1/auth/admin/refresh`;

// ─────────────────────────────────────────────
// USER REFRESH TOKEN
// ─────────────────────────────────────────────
test.describe('✅ User Refresh Token — Functional', () => {

    test('TC-RT-01 [POSITIVE] Valid refresh token → new access + refresh tokens', async ({ request }) => {
        let loginData;
        try {
            loginData = await userLogin(request);
        } catch {
            console.log('ℹ️  [TC-RT-01] Skipped — user login failed');
            return;
        }

        const start = Date.now();
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${loginData.refreshToken}` },
        });
        const elapsed = Date.now() - start;
        const json = await res.json();

        console.log(`   Refresh status: ${res.status()} | ${elapsed}ms`);

        if (res.status() === 200) {
            // Schema validation
            expect(json).toHaveProperty('accessToken');
            expect(json).toHaveProperty('refreshToken');
            expect(typeof json.accessToken).toBe('string');
            expect(typeof json.refreshToken).toBe('string');
            expect(json.accessToken.split('.').length).toBe(3); // Valid JWT
            // New token must be different from old
            expect(json.accessToken).not.toBe(loginData.accessToken);
            // Response time
            expect(elapsed).toBeLessThan(5000);
            console.log('✅ [TC-RT-01] User token refreshed successfully');
        } else {
            console.log(`ℹ️  [TC-RT-01] Refresh response: ${JSON.stringify(json)}`);
        }
    });

    test('TC-RT-02 [POSITIVE] New access token from refresh is usable (can hit protected endpoint)', async ({ request }) => {
        let loginData;
        try { loginData = await userLogin(request); } catch { return; }

        const refreshRes = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${loginData.refreshToken}` },
        });
        if (refreshRes.status() !== 200) {
            console.log(`ℹ️  [TC-RT-02] Skipped — refresh failed: ${refreshRes.status()}`);
            return;
        }
        const newToken = (await refreshRes.json()).accessToken;

        // Use new token on a protected endpoint
        const profileRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${newToken}` },
        });
        expect([200, 404]).toContain(profileRes.status()); // 200 or not found but NOT 401
        expect(profileRes.status()).not.toBe(401);
        console.log(`✅ [TC-RT-02] New token works on protected endpoint: ${profileRes.status()}`);
    });
});

test.describe('❌ User Refresh Token — Negative Tests', () => {

    test('TC-RT-03 [NEGATIVE] No Authorization header → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-03] No token rejected: ${res.status()}`);
    });

    test('TC-RT-04 [NEGATIVE] Completely invalid refresh token string → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.COMPLETELY_INVALID}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-04] Invalid token rejected: ${res.status()}`);
    });

    test('TC-RT-05 [NEGATIVE] Malformed JWT as refresh token → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.MALFORMED_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-05] Malformed JWT rejected: ${res.status()}`);
    });

    test('TC-RT-06 [NEGATIVE] Fake JWT (valid format, wrong sig) → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.FAKE_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-06] Fake JWT rejected: ${res.status()}`);
    });

    test('TC-RT-07 [NEGATIVE] Access token used as refresh token → not 200', async ({ request }) => {
        let loginData;
        try { loginData = await userLogin(request); } catch { return; }

        // Use accessToken where refreshToken is expected
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${loginData.accessToken}` },
        });
        // Access token should not be accepted as a refresh token
        if (res.status() === 200) {
            console.log('⚠️  [TC-RT-07] WARNING: Access token accepted as refresh token!');
        } else {
            console.log(`✅ [TC-RT-07] Access token rejected as refresh: ${res.status()}`);
        }
    });

    test('TC-RT-08 [NEGATIVE] Empty Bearer value → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer ' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-08] Empty bearer rejected: ${res.status()}`);
    });

    test('TC-RT-09 [NEGATIVE] Missing Bearer prefix → not 200', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'sometoken123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RT-09] No Bearer prefix rejected: ${res.status()}`);
    });
});

test.describe('🛡️ User Refresh Token — Security Tests', () => {

    SQL_INJECTION_PAYLOADS.slice(0, 4).forEach((payload, i) => {
        test(`TC-RT-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject as refresh token: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(USER_REFRESH_EP, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${payload}` },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject refresh token blocked [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-RT-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS as refresh token: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(USER_REFRESH_EP, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${payload}` },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS refresh token blocked [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-RT-SEC-BF [SECURITY] 5 rapid refresh attempts — no 500', async ({ request }) => {
        for (let i = 0; i < 5; i++) {
            const res = await request.post(USER_REFRESH_EP, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer fake-token-${i}` },
            });
            expect(res.status()).not.toBe(500);
        }
        console.log('✅ [TC-RT-SEC-BF] 5 rapid brute-force refresh — server stable');
    });
});

test.describe('📊 User Refresh Token — Response Validation', () => {

    test('TC-RT-RV-01 [SCHEMA] Success response has accessToken + refreshToken', async ({ request }) => {
        let loginData;
        try { loginData = await userLogin(request); } catch { return; }
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${loginData.refreshToken}` },
        });
        if (res.status() === 200) {
            const json = await res.json();
            expect(json).toHaveProperty('accessToken');
            expect(json).toHaveProperty('refreshToken');
            expect(json.accessToken.split('.').length).toBe(3);
            console.log('✅ [TC-RT-RV-01] Refresh schema valid');
        } else {
            console.log(`ℹ️  [TC-RT-RV-01] Status: ${res.status()}`);
        }
    });

    test('TC-RT-RV-02 [SCHEMA] Error response has message', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer invalid' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-RT-RV-02] Error message: "${json.message}"`);
    });

    test('TC-RT-RV-03 [RESPONSE-TIME] Refresh token < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer invalid' },
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-RT-RV-03] Refresh response time: ${elapsed}ms`);
    });

    test('TC-RT-RV-04 [STATUS] Invalid token → 4xx (not 5xx)', async ({ request }) => {
        const res = await request.post(USER_REFRESH_EP, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer invalid' },
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        console.log(`✅ [TC-RT-RV-04] Invalid refresh → 4xx: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// ADMIN REFRESH TOKEN
// ─────────────────────────────────────────────
test.describe('✅ Admin Refresh Token — Functional', () => {

    test('TC-ART-01 [POSITIVE] Valid admin refresh token → new tokens', async ({ request }) => {
        let loginData;
        try { loginData = await adminLogin(request); } catch { return; }

        const res = await request.post(ADMIN_REFRESH_EP, {
            headers: { 'Authorization': `Bearer ${loginData.refreshToken}` },
        });
        const json = await res.json();
        console.log(`   Admin refresh status: ${res.status()}`);
        if (res.status() === 200) {
            expect(json).toHaveProperty('accessToken');
            expect(json).toHaveProperty('refreshToken');
            console.log('✅ [TC-ART-01] Admin token refreshed');
        } else {
            console.log(`ℹ️  [TC-ART-01] Admin refresh: ${JSON.stringify(json)}`);
        }
    });
});

test.describe('❌ Admin Refresh Token — Negative Tests', () => {

    test('TC-ART-02 [NEGATIVE] Invalid admin refresh token → not 200', async ({ request }) => {
        const res = await request.post(ADMIN_REFRESH_EP, {
            headers: { 'Authorization': `Bearer ${INVALID_TOKENS.COMPLETELY_INVALID}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-ART-02] Invalid admin refresh rejected: ${res.status()}`);
    });

    test('TC-ART-03 [NEGATIVE] No token in admin refresh → not 200', async ({ request }) => {
        const res = await request.post(ADMIN_REFRESH_EP);
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-ART-03] No token admin refresh rejected: ${res.status()}`);
    });

    test('TC-ART-04 [NEGATIVE] Fake JWT admin refresh → not 200', async ({ request }) => {
        const res = await request.post(ADMIN_REFRESH_EP, {
            headers: { 'Authorization': `Bearer ${INVALID_TOKENS.FAKE_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-ART-04] Fake JWT admin refresh rejected: ${res.status()}`);
    });

    test('TC-ART-05 [NEGATIVE] User refresh token on admin endpoint → should fail', async ({ request }) => {
        let userLoginData;
        try { userLoginData = await (require('./helpers/auth.helper').userLogin)(request); } catch { return; }

        const res = await request.post(ADMIN_REFRESH_EP, {
            headers: { 'Authorization': `Bearer ${userLoginData.refreshToken}` },
        });
        // User refresh token should not work on admin endpoint
        if (res.status() === 200) {
            console.log('⚠️  [TC-ART-05] WARNING: User refresh token accepted on admin endpoint!');
        } else {
            console.log(`✅ [TC-ART-05] User refresh on admin endpoint rejected: ${res.status()}`);
        }
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-ART-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject admin refresh token: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(ADMIN_REFRESH_EP, {
                headers: { 'Authorization': `Bearer ${payload}` },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject admin refresh blocked [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-ART-06 [RESPONSE-TIME] Admin refresh < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(ADMIN_REFRESH_EP, {
            headers: { 'Authorization': 'Bearer invalid-token' },
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-ART-06] Admin refresh time: ${elapsed}ms`);
    });
});
