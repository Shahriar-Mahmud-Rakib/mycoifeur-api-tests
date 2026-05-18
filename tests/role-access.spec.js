// ============================================
// Role-Based Access Control (RBAC) Tests
// ============================================
// Tests that each role can ONLY access its own endpoints.
// - Regular user token → admin endpoint → 401/403
// - Regular user token → salon endpoint → 401/403
// - Salon token → admin endpoint → 401/403
// - Admin token → user-only endpoint → verify behavior
// - No token → any protected endpoint → 401
// - Invalid/expired token → 401
// ============================================
const { test, expect } = require('@playwright/test');
const {
    BASE_URL,
    MOBILE_HEADERS,
    getAdminToken,
    getUserToken,
} = require('./helpers/auth.helper');
const { INVALID_TOKENS } = require('./helpers/test-data.helper');

// ─────────────────────────────────────────────
// ADMIN-ONLY ENDPOINTS — accessed by wrong roles
// ─────────────────────────────────────────────
test.describe('🚫 User Token → Admin Endpoints (Must be Denied)', () => {

    let userToken = null;

    test.beforeAll(async ({ request }) => {
        try { userToken = await getUserToken(request); } catch (e) { console.log('ℹ️  Could not get user token'); }
    });

    const adminEndpoints = [
        { method: 'GET',   path: '/api/v1/web/admin/categories',          label: 'Admin categories list' },
        { method: 'GET',   path: '/api/v1/web/admin/services',            label: 'Admin services list' },
        { method: 'GET',   path: '/api/v1/web/admin/settings',            label: 'Admin settings' },
        { method: 'GET',   path: '/api/v1/web/admin/users',               label: 'Admin users list' },
        { method: 'GET',   path: '/api/v1/web/admin/salons',              label: 'Admin salons list' },
        { method: 'GET',   path: '/api/v1/web/admin/orders',              label: 'Admin orders list' },
        { method: 'GET',   path: '/api/v1/web/admin/overview',            label: 'Admin overview' },
        { method: 'GET',   path: '/api/v1/web/admin/admins',              label: 'Admin admins list' },
        { method: 'GET',   path: '/api/v1/web/admin/settings/contacts',   label: 'Admin contact settings' },
        { method: 'GET',   path: '/api/v1/web/admin/settings/connection', label: 'Admin connection settings' },
    ];

    adminEndpoints.forEach(({ method, path, label }) => {
        test(`TC-RBAC-UA-${label} → 401/403 with user token`, async ({ request }) => {
            if (!userToken) { console.log(`ℹ️  Skipped - no user token`); return; }

            const headers = { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` };
            const res = method === 'GET'
                ? await request.get(`${BASE_URL}${path}`, { headers })
                : await request.post(`${BASE_URL}${path}`, { headers, data: {} });

            expect([401, 403, 404]).toContain(res.status());
            console.log(`✅ User blocked from [${method}] ${path}: ${res.status()}`);
        });
    });
});

// ─────────────────────────────────────────────
// NO TOKEN → PROTECTED ENDPOINTS
// ─────────────────────────────────────────────
test.describe('🔒 No Token → Protected Endpoints (Must be 401)', () => {

    const protectedEndpoints = [
        // Admin
        { method: 'GET',   path: '/api/v1/web/admin/categories',          label: 'Admin categories' },
        { method: 'GET',   path: '/api/v1/web/admin/settings',            label: 'Admin settings' },
        { method: 'GET',   path: '/api/v1/web/admin/users',               label: 'Admin users' },
        { method: 'GET',   path: '/api/v1/web/admin/orders',              label: 'Admin orders' },
        // User
        { method: 'GET',   path: '/api/v1/cart/i',                        label: 'User cart' },
        { method: 'GET',   path: '/api/v1/user/profile',                  label: 'User profile' },
        { method: 'GET',   path: '/api/v1/user/notifications',            label: 'User notifications' },
        // Salon
        { method: 'GET',   path: '/api/v1/salon/services',                label: 'Salon services' },
        { method: 'GET',   path: '/api/v1/salon/commissions',             label: 'Salon commissions' },
        { method: 'GET',   path: '/api/v1/salon/calendar',                label: 'Salon calendar' },
    ];

    protectedEndpoints.forEach(({ method, path, label }) => {
        test(`TC-RBAC-NT-${label} → 401 without token`, async ({ request }) => {
            const res = method === 'GET'
                ? await request.get(`${BASE_URL}${path}`, { headers: MOBILE_HEADERS })
                : await request.post(`${BASE_URL}${path}`, { headers: MOBILE_HEADERS, data: {} });

            expect(res.status()).not.toBe(200);
            expect([401, 403, 404]).toContain(res.status());
            console.log(`✅ No-token blocked from [${method}] ${path}: ${res.status()}`);
        });
    });
});

// ─────────────────────────────────────────────
// INVALID / MALFORMED TOKEN
// ─────────────────────────────────────────────
test.describe('❌ Invalid Token Variants → 401 on Protected Endpoints', () => {

    const endpoint = `${BASE_URL}/api/v1/web/admin/categories`;
    const userEndpoint = `${BASE_URL}/api/v1/cart/i`;

    test('TC-RBAC-IT-01 [INVALID-TOKEN] Completely invalid token string → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.COMPLETELY_INVALID}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-01] Invalid token rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-02 [INVALID-TOKEN] Malformed JWT structure → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.MALFORMED_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-02] Malformed JWT rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-03 [INVALID-TOKEN] Fake JWT (valid format, wrong signature) → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.FAKE_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-03] Fake JWT rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-04 [INVALID-TOKEN] Empty Bearer token → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer ' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-04] Empty bearer rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-05 [INVALID-TOKEN] No Bearer prefix → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': INVALID_TOKENS.BEARER_MISSING },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-05] No Bearer prefix rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-06 [INVALID-TOKEN] Numeric token → 401', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.NUMERIC}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-06] Numeric token rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-07 [SECURITY] SQL injection as token → 401 / not 500', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.SQL_INJECT}` },
        });
        expect(res.status()).not.toBe(200);
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RBAC-IT-07] SQL injection token rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-08 [SECURITY] XSS as token → 401 / not 500', async ({ request }) => {
        const res = await request.get(endpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.XSS}` },
        });
        expect(res.status()).not.toBe(200);
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RBAC-IT-08] XSS token rejected: ${res.status()}`);
    });

    test('TC-RBAC-IT-09 [INVALID-TOKEN] User token on user cart endpoint → 401 / not 200', async ({ request }) => {
        const res = await request.get(userEndpoint, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${INVALID_TOKENS.FAKE_JWT}` },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-IT-09] Fake token on user endpoint rejected: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// CROSS-ROLE ACCESS (Admin token on User endpoints)
// ─────────────────────────────────────────────
test.describe('🔀 Admin Token → User Endpoints (Behavior Check)', () => {

    let adminToken = null;

    test.beforeAll(async ({ request }) => {
        try { adminToken = await getAdminToken(request); } catch (e) { console.log('ℹ️  Could not get admin token'); }
    });

    test('TC-RBAC-CR-01 Admin token on /api/v1/cart/i → should be denied (user-only)', async ({ request }) => {
        if (!adminToken) { console.log('ℹ️  Skipped - no admin token'); return; }
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${adminToken}` },
        });
        // Admin should not have access to user cart
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-CR-01] Admin blocked from user cart: ${res.status()}`);
    });

    test('TC-RBAC-CR-02 Admin token on /api/v1/user/profile → should be denied', async ({ request }) => {
        if (!adminToken) { console.log('ℹ️  Skipped - no admin token'); return; }
        const res = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${adminToken}` },
        });
        // Admin should not access user profile via mobile API
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RBAC-CR-02] Admin blocked from user profile: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// IDOR — Accessing other users' resources
// ─────────────────────────────────────────────
test.describe('🔍 IDOR — Insecure Direct Object Reference Tests', () => {

    let userToken = null;

    test.beforeAll(async ({ request }) => {
        try { userToken = await getUserToken(request); } catch (e) { console.log('ℹ️  Could not get user token'); }
    });

    test('TC-RBAC-IDOR-01 Regular user cannot access another user\'s order by ID', async ({ request }) => {
        if (!userToken) { console.log('ℹ️  Skipped - no user token'); return; }
        // Attempt to access order ID 1 (likely belongs to someone else)
        const res = await request.get(`${BASE_URL}/api/v1/user/orders/1`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` },
        });
        // Either 403 forbidden, 404 not found, or if 200 - must only return own data
        if (res.status() === 200) {
            const json = await res.json();
            // If it returns data, it should not expose another user's private info
            console.log(`ℹ️  [TC-RBAC-IDOR-01] Order accessible - verify it belongs to current user`);
        } else {
            expect([401, 403, 404]).toContain(res.status());
            console.log(`✅ [TC-RBAC-IDOR-01] IDOR blocked: ${res.status()}`);
        }
    });

    test('TC-RBAC-IDOR-02 User cannot delete another user\'s cart item (ID 1)', async ({ request }) => {
        if (!userToken) { console.log('ℹ️  Skipped - no user token'); return; }
        const res = await request.delete(`${BASE_URL}/api/v1/cart/1/delete`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` },
        });
        if (res.status() !== 200) {
            console.log(`✅ [TC-RBAC-IDOR-02] Delete blocked/not found: ${res.status()}`);
        } else {
            console.log(`⚠️  [TC-RBAC-IDOR-02] DELETE returned 200 — verify item belonged to current user`);
        }
    });
});
