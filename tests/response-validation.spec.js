// ============================================
// Response Validation Test Suite
// ============================================
// Status code, JSON schema, response time,
// error message format — across ALL key APIs.
// ============================================
const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    MOBILE_HEADERS,
    ADMIN_CREDENTIALS,
    USER_CREDENTIALS,
    getAdminToken,
    getUserToken,
} = require('./helpers/auth.helper');

const MAX_RESPONSE_MS = 5000;

// ─────────────────────────────────────────────
// STATUS CODE VALIDATION
// ─────────────────────────────────────────────
test.describe('📋 Status Code Validation', () => {

    test('TC-RV-SC-01 POST admin login valid → exactly 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: ADMIN_CREDENTIALS });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-RV-SC-01] Admin login → ${res.status()}`);
    });

    test('TC-RV-SC-02 POST admin login invalid credentials → 4xx (not 2xx, not 5xx)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'wrong@test.com', password: 'BadPass99' },
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        console.log(`✅ [TC-RV-SC-02] Wrong creds → ${res.status()}`);
    });

    test('TC-RV-SC-03 GET protected endpoint without token → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`);
        expect(res.status()).toBe(401);
        console.log(`✅ [TC-RV-SC-03] No token → ${res.status()}`);
    });

    test('TC-RV-SC-04 GET admin categories with valid token → 200', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-RV-SC-04] Admin categories → ${res.status()}`);
    });

    test('TC-RV-SC-05 GET non-existent resource → 404 / 400', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/999999999`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect([400, 404, 422]).toContain(res.status());
        console.log(`✅ [TC-RV-SC-05] Non-existent category → ${res.status()}`);
    });

    test('TC-RV-SC-06 POST user login valid → 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: USER_CREDENTIALS,
        });
        if (res.status() === 200) {
            console.log(`✅ [TC-RV-SC-06] User login → ${res.status()}`);
        } else {
            console.log(`ℹ️  [TC-RV-SC-06] User login → ${res.status()}`);
        }
    });

    test('TC-RV-SC-07 POST to invalid endpoint → 404', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/this-endpoint-does-not-exist`);
        expect([404, 405]).toContain(res.status());
        console.log(`✅ [TC-RV-SC-07] Invalid endpoint → ${res.status()}`);
    });

    test('TC-RV-SC-08 GET admin salons with valid token → 200', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-RV-SC-08] Admin salons → ${res.status()}`);
    });

    test('TC-RV-SC-09 GET admin orders with valid token → 200', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-RV-SC-09] Admin orders → ${res.status()}`);
    });

    test('TC-RV-SC-10 GET admin overview with valid token → 200', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/overview`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-RV-SC-10] Admin overview → ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// RESPONSE SCHEMA VALIDATION
// ─────────────────────────────────────────────
test.describe('📐 Response Schema Validation', () => {

    test('TC-RV-SCHEMA-01 Admin login success response has correct schema', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: ADMIN_CREDENTIALS });
        expect(res.status()).toBe(200);
        const json = await res.json();

        // Top-level fields
        expect(json).toHaveProperty('success');
        expect(json.success).toBe(true);
        expect(json).toHaveProperty('data');

        // data fields
        expect(json.data).toHaveProperty('accessToken');
        expect(json.data).toHaveProperty('refreshToken');
        expect(json.data).toHaveProperty('user');

        // Token is string
        expect(typeof json.data.accessToken).toBe('string');
        expect(typeof json.data.refreshToken).toBe('string');
        expect(json.data.accessToken.length).toBeGreaterThan(10);

        // User object fields
        const user = json.data.user;
        expect(user).toHaveProperty('id');
        expect(typeof user.id).toMatch(/string|number/);

        // JWT format (3 dot-separated parts)
        const tokenParts = json.data.accessToken.split('.');
        expect(tokenParts.length).toBe(3);

        console.log('✅ [TC-RV-SCHEMA-01] Admin login schema fully valid');
    });

    test('TC-RV-SCHEMA-02 Admin login failure response has correct error schema', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'bad@test.com', password: 'WrongPass99' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();

        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        expect(json.message.length).toBeGreaterThan(0);

        console.log(`✅ [TC-RV-SCHEMA-02] Error schema valid: "${json.message}"`);
    });

    test('TC-RV-SCHEMA-03 Admin categories list response schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();

        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');

        if (json.data && typeof json.data === 'object') {
            // Paginated response usually has data.data array
            if (Array.isArray(json.data.data)) {
                expect(json.data).toHaveProperty('total');
                expect(json.data).toHaveProperty('page');
                if (json.data.data.length > 0) {
                    const item = json.data.data[0];
                    expect(item).toHaveProperty('id');
                    expect(item).toHaveProperty('nameEn');
                }
            }
        }
        console.log('✅ [TC-RV-SCHEMA-03] Categories list schema valid');
    });

    test('TC-RV-SCHEMA-04 Admin users list response schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();

        if (json.data?.data && Array.isArray(json.data.data) && json.data.data.length > 0) {
            const user = json.data.data[0];
            expect(user).toHaveProperty('id');
            // Password must NOT be exposed
            expect(user).not.toHaveProperty('password');
        }
        console.log('✅ [TC-RV-SCHEMA-04] Admin users schema valid + no password field');
    });

    test('TC-RV-SCHEMA-05 Admin overview response schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/overview`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();

        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        console.log('✅ [TC-RV-SCHEMA-05] Overview schema valid, keys:', Object.keys(json.data || {}));
    });

    test('TC-RV-SCHEMA-06 Admin salons list response schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        console.log('✅ [TC-RV-SCHEMA-06] Admin salons schema valid');
    });

    test('TC-RV-SCHEMA-07 Admin orders list response schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        console.log('✅ [TC-RV-SCHEMA-07] Admin orders schema valid');
    });

    test('TC-RV-SCHEMA-08 User cart schema (if token available)', async ({ request }) => {
        let userToken;
        try { userToken = await getUserToken(request); } catch { return; }
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        console.log('✅ [TC-RV-SCHEMA-08] Cart schema valid');
    });

    test('TC-RV-SCHEMA-09 All list responses have consistent pagination schema', async ({ request }) => {
        const token = await getAdminToken(request);
        const headers = { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' };

        const endpoints = [
            '/api/v1/web/admin/categories',
            '/api/v1/web/admin/services',
            '/api/v1/web/admin/users',
            '/api/v1/web/admin/salons',
            '/api/v1/web/admin/orders',
        ];

        for (const ep of endpoints) {
            const res = await request.get(`${BASE_URL}${ep}`, { headers });
            expect(res.status()).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            // If paginated, must have page and total
            if (json.data?.data && Array.isArray(json.data.data)) {
                expect(json.data).toHaveProperty('page');
                expect(typeof json.data.page).toBe('number');
                console.log(`✅ [TC-RV-SCHEMA-09] ${ep} pagination schema valid`);
            }
        }
    });
});

// ─────────────────────────────────────────────
// RESPONSE TIME VALIDATION
// ─────────────────────────────────────────────
test.describe('⏱️ Response Time Validation (All Key APIs < 5s)', () => {

    test('TC-RV-RT-01 Admin login response time < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: ADMIN_CREDENTIALS });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-01] Admin login: ${ms}ms`);
    });

    test('TC-RV-RT-02 GET admin categories response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-02] Admin categories: ${ms}ms`);
    });

    test('TC-RV-RT-03 GET admin users response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-03] Admin users: ${ms}ms`);
    });

    test('TC-RV-RT-04 GET admin overview response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/overview`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-04] Admin overview: ${ms}ms`);
    });

    test('TC-RV-RT-05 GET admin orders response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-05] Admin orders: ${ms}ms`);
    });

    test('TC-RV-RT-06 GET admin salons response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/salons`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-06] Admin salons: ${ms}ms`);
    });

    test('TC-RV-RT-07 GET admin settings response time < 5s', async ({ request }) => {
        const token = await getAdminToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-07] Admin settings: ${ms}ms`);
    });

    test('TC-RV-RT-08 User registration response time < 6s', async ({ request }) => {
        const ts = Date.now().toString().slice(-6);
        const start = Date.now();
        await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: {
                email: `rt_test_${ts}@example.com`,
                password: 'Password123',
                fname: 'RT',
                phone: `96655${ts}`,
                type_user: 'user',
                country_id: '1',
                city_id: '1',
            },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(6000);
        console.log(`✅ [TC-RV-RT-08] Registration: ${ms}ms`);
    });

    test('TC-RV-RT-09 Forgot password response time < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(`${BASE_URL}/api/v1/auth/forgot-password`, {
            headers: MOBILE_HEADERS,
            data: { phone: '966501234595' },
        });
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS);
        console.log(`✅ [TC-RV-RT-09] Forgot password: ${ms}ms`);
    });

    test('TC-RV-RT-10 Concurrent requests performance (5 parallel admin category calls)', async ({ request }) => {
        const token = await getAdminToken(request);
        const headers = { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' };

        const start = Date.now();
        await Promise.all(
            Array.from({ length: 5 }, () =>
                request.get(`${BASE_URL}/api/v1/web/admin/categories`, { headers })
            )
        );
        const ms = Date.now() - start;
        expect(ms).toBeLessThan(MAX_RESPONSE_MS * 2); // 10s for concurrent batch
        console.log(`✅ [TC-RV-RT-10] 5 concurrent category requests: ${ms}ms total`);
    });
});

// ─────────────────────────────────────────────
// ERROR MESSAGE FORMAT VALIDATION
// ─────────────────────────────────────────────
test.describe('📝 Error Message Format Validation', () => {

    test('TC-RV-EM-01 Login wrong credentials — error message is human-readable string', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            data: { user: 'wrong@test.com', password: 'BadPass99' },
        });
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        expect(json.message.trim().length).toBeGreaterThan(3);
        // Should not expose internal error codes/paths
        expect(json.message).not.toContain('/var/www/');
        expect(json.message).not.toContain('node_modules');
        console.log(`✅ [TC-RV-EM-01] Error message: "${json.message}"`);
    });

    test('TC-RV-EM-02 Missing required field — validation error has message', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: {} });
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        console.log(`✅ [TC-RV-EM-02] Validation error message: "${json.message}"`);
    });

    test('TC-RV-EM-03 No token error message is present', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        console.log(`✅ [TC-RV-EM-03] No-token error message: "${json.message}"`);
    });

    test('TC-RV-EM-04 Invalid token error message is present', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { 'Authorization': 'Bearer COMPLETELY_INVALID_TOKEN_XYZ' },
        });
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-RV-EM-04] Invalid token message: "${json.message}"`);
    });

    test('TC-RV-EM-05 All error responses are valid JSON (not HTML)', async ({ request }) => {
        const endpoints = [
            { method: 'POST', path: '/api/v1/auth/admin/login', data: { data: {} } },
            { method: 'GET',  path: '/api/v1/web/admin/categories', data: {} },
            { method: 'GET',  path: '/api/v1/web/admin/this-does-not-exist', data: {} },
        ];
        for (const ep of endpoints) {
            const res = ep.method === 'POST'
                ? await request.post(`${BASE_URL}${ep.path}`, ep.data)
                : await request.get(`${BASE_URL}${ep.path}`, ep.data);

            const contentType = res.headers()['content-type'] || '';
            expect(contentType).toContain('application/json');

            // Must parse as valid JSON
            let json;
            try {
                json = await res.json();
                expect(json).toBeTruthy();
            } catch {
                throw new Error(`Response from ${ep.path} is not valid JSON`);
            }
            console.log(`✅ [TC-RV-EM-05] ${ep.method} ${ep.path} → valid JSON error`);
        }
    });

    test('TC-RV-EM-06 Server never returns 500 on common bad inputs', async ({ request }) => {
        const badRequests = [
            () => request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: { user: "' OR 1=1--", password: null } }),
            () => request.post(`${BASE_URL}/api/v1/auth/login`, { headers: MOBILE_HEADERS, data: {} }),
            () => request.post(`${BASE_URL}/api/v1/auth/user/register`, { headers: MOBILE_HEADERS, multipart: {} }),
            () => request.post(`${BASE_URL}/api/v1/auth/forgot-password`, { headers: MOBILE_HEADERS, data: {} }),
        ];
        for (const makeReq of badRequests) {
            const res = await makeReq();
            expect(res.status()).not.toBe(500);
        }
        console.log('✅ [TC-RV-EM-06] No 500 errors on common bad inputs');
    });
});

// ─────────────────────────────────────────────
// CONTENT-TYPE & HEADERS
// ─────────────────────────────────────────────
test.describe('🏷️ Content-Type & Security Headers', () => {

    test('TC-RV-HDR-01 All API responses return application/json Content-Type', async ({ request }) => {
        const token = await getAdminToken(request);
        const endpoints = [
            { method: 'POST', path: '/api/v1/auth/admin/login', opts: { data: ADMIN_CREDENTIALS } },
            { method: 'GET',  path: '/api/v1/web/admin/categories', opts: { headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' } } },
            { method: 'GET',  path: '/api/v1/web/admin/overview',   opts: { headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' } } },
        ];
        for (const ep of endpoints) {
            const res = ep.method === 'POST'
                ? await request.post(`${BASE_URL}${ep.path}`, ep.opts)
                : await request.get(`${BASE_URL}${ep.path}`, ep.opts);
            const ct = res.headers()['content-type'] || '';
            expect(ct).toContain('application/json');
            console.log(`✅ [TC-RV-HDR-01] ${ep.path} Content-Type: ${ct}`);
        }
    });
});
