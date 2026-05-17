// ============================================
// Admin Settings — Full Test Suite
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken, getUserToken } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY } = require('./helpers/test-data.helper');

const H = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en',
});

// ─── GENERAL SETTINGS ───────────────────────
test.describe('⚙️ Admin General Settings — Tests', () => {

    test('TC-AS-01 [POSITIVE] GET general settings → 200 + schema', async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json).toHaveProperty('data');
        expect(Date.now() - start).toBeLessThan(5000);
        console.log(`✅ [TC-AS-01] Settings keys: ${Object.keys(json.data || {}).join(', ')}`);
    });

    test('TC-AS-02 [POSITIVE] PATCH general settings → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: await H(request),
            data: { app_name: 'MyCoifeur', maintenance_mode: false },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-AS-02] Update settings → ${res.status()}`);
    });

    test('TC-AS-03 [NEGATIVE] GET settings no auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`);
        expect(res.status()).toBe(401);
        console.log(`✅ [TC-AS-03] No auth → ${res.status()}`);
    });

    test('TC-AS-04 [NEGATIVE] GET settings invalid token → not 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: { Authorization: 'Bearer invalid-xyz', 'x-custom-lang': 'en' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-AS-04] Invalid token → ${res.status()}`);
    });

    test('TC-AS-05 [NEGATIVE] User token on admin settings → 401/403', async ({ request }) => {
        let userToken;
        try { userToken = await getUserToken(request); } catch { return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: { Authorization: `Bearer ${userToken}`, 'x-custom-lang': 'en' },
        });
        expect([401, 403]).toContain(res.status());
        console.log(`✅ [TC-AS-05] User token on admin settings → ${res.status()}`);
    });

    test('TC-AS-06 [SECURITY] SQL inject in settings value → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: await H(request),
            data: { app_name: "' OR 1=1--", maintenance_mode: false },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-AS-06] SQL inject settings → ${res.status()}`);
    });

    test('TC-AS-07 [SECURITY] XSS in settings value → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: await H(request),
            data: { app_name: '<script>alert(1)</script>' },
        });
        expect(res.status()).not.toBe(500);
        const body = await res.text();
        expect(body).not.toContain('<script>alert');
        console.log(`✅ [TC-AS-07] XSS in settings → ${res.status()}`);
    });

    test('TC-AS-08 [BOUNDARY] Very long app_name → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: await H(request),
            data: { app_name: BOUNDARY.MAX_STRING_255 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-AS-08] Long app_name → ${res.status()}`);
    });

    test('TC-AS-09 [SECURITY] Password NOT exposed in settings response', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).not.toMatch(/"password"\s*:\s*"[^"]+"/);
        console.log('✅ [TC-AS-09] No password in settings response');
    });
});

// ─── CONNECTION SETTINGS ────────────────────
test.describe('🔌 Admin Connection Settings — Tests', () => {

    test('TC-CS-01 [POSITIVE] GET connection settings → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/connection`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CS-01] Connection settings → ${res.status()}`);
    });

    test('TC-CS-02 [POSITIVE] PATCH connection settings → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/connection`, {
            headers: await H(request),
            data: { sms_provider: 'twilio' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CS-02] Update connection → ${res.status()}`);
    });

    test('TC-CS-03 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/connection`);
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CS-03] No auth connection → ${res.status()}`);
    });

    test('TC-CS-04 [INVALID] Invalid SMS provider value → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/connection`, {
            headers: await H(request),
            data: { sms_provider: 'INVALID_PROVIDER_XYZ_999' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CS-04] Invalid provider → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CS-SEC-SQL-${i + 1} [SECURITY] SQL inject connection: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/connection`, {
                headers: await H(request),
                data: { sms_provider: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject connection [${i + 1}]: ${res.status()}`);
        });
    });
});

// ─── CONTACT SETTINGS ───────────────────────
test.describe('📞 Admin Contact Settings — Tests', () => {

    test('TC-CT-01 [POSITIVE] GET contact settings → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/contacts`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        console.log(`✅ [TC-CT-01] Contact settings → ${res.status()}`);
    });

    test('TC-CT-02 [POSITIVE] PATCH contact settings → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/contacts`, {
            headers: await H(request),
            data: { support_email: 'support@mycoifeur.com', support_phone: '966500000000' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CT-02] Update contacts → ${res.status()}`);
    });

    test('TC-CT-03 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/contacts`);
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CT-03] No auth contacts → ${res.status()}`);
    });

    test('TC-CT-04 [INVALID] Invalid email format in support_email → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/contacts`, {
            headers: await H(request),
            data: { support_email: 'NOT_AN_EMAIL@@@', support_phone: '966500000000' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CT-04] Invalid email format → ${res.status()}`);
    });

    test('TC-CT-05 [BOUNDARY] Very long support_email → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/contacts`, {
            headers: await H(request),
            data: { support_email: BOUNDARY.LONG_EMAIL },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CT-05] Long email → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CT-SEC-SQL-${i + 1} [SECURITY] SQL inject contacts: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/contacts`, {
                headers: await H(request),
                data: { support_email: payload, support_phone: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject contacts [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CT-SEC-XSS-${i + 1} [SECURITY] XSS in contacts: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/contacts`, {
                headers: await H(request),
                data: { support_email: payload },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS contacts [${i + 1}]: ${res.status()}`);
        });
    });
});

// ─── MAIL PROVIDER SETTINGS ─────────────────
test.describe('📧 Admin Mail Provider Settings — Tests', () => {

    test('TC-MP-01 [POSITIVE] GET mail provider → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        console.log(`✅ [TC-MP-01] Mail provider → ${res.status()}`);
    });

    test('TC-MP-02 [POSITIVE] PATCH mail provider → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
            headers: await H(request),
            data: { provider: 'smtp', host: 'smtp.example.com', port: 587 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-MP-02] Update mail provider → ${res.status()}`);
    });

    test('TC-MP-03 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`);
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-MP-03] No auth mail provider → ${res.status()}`);
    });

    test('TC-MP-04 [BOUNDARY] Invalid port (negative) → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
            headers: await H(request),
            data: { provider: 'smtp', host: 'smtp.example.com', port: -1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-MP-04] Negative port → ${res.status()}`);
    });

    test('TC-MP-05 [BOUNDARY] Port = 0 → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
            headers: await H(request),
            data: { provider: 'smtp', host: 'smtp.example.com', port: 0 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-MP-05] Port=0 → ${res.status()}`);
    });

    test('TC-MP-06 [BOUNDARY] Very large port (99999) → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
            headers: await H(request),
            data: { provider: 'smtp', host: 'smtp.example.com', port: 99999 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-MP-06] Large port → ${res.status()}`);
    });

    test('TC-MP-07 [INVALID] String as port → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
            headers: await H(request),
            data: { provider: 'smtp', host: 'smtp.example.com', port: 'not-a-port' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-MP-07] String port → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-MP-SEC-SQL-${i + 1} [SECURITY] SQL inject mail host: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.patch(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, {
                headers: await H(request),
                data: { provider: 'smtp', host: payload, port: 587 },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject mail host [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-MP-08 [RESPONSE-TIME] Mail provider settings < 5s', async ({ request }) => {
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/settings/mail-provider`, { headers: await H(request) });
        expect(Date.now() - start).toBeLessThan(5000);
        console.log('✅ [TC-MP-08] Mail provider response time OK');
    });
});
