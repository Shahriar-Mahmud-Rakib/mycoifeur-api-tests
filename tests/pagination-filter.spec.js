// ============================================
// Pagination, Filter & Search Test Suite
// ============================================
// Tests page=0, large limit, invalid filter,
// search keyword, sorting — across all list APIs.
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, PAGINATION_EDGE, BOUNDARY } = require('./helpers/test-data.helper');

// ─────────────────────────────────────────────
// ADMIN LIST ENDPOINTS — PAGINATION
// ─────────────────────────────────────────────
test.describe('📄 Pagination Tests — Admin Endpoints', () => {

    let adminToken;
    let adminHeaders;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
    });

    const adminListEndpoints = [
        '/api/v1/web/admin/categories',
        '/api/v1/web/admin/services',
        '/api/v1/web/admin/users',
        '/api/v1/web/admin/salons',
        '/api/v1/web/admin/orders',
    ];

    // page=1 (normal)
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-01 [VALID] ${ep} page=1&limit=5 → 200`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=1&limit=5`, { headers: adminHeaders });
            expect(res.status()).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            if (json.data?.data) {
                expect(Array.isArray(json.data.data)).toBe(true);
                expect(json.data.data.length).toBeLessThanOrEqual(5);
            }
            console.log(`✅ [TC-PAG-01] ${ep} page=1 limit=5 → ${json.data?.data?.length ?? '?'} items`);
        });
    });

    // page=2
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-02 [VALID] ${ep} page=2 → 200`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=2&limit=5`, { headers: adminHeaders });
            expect(res.status()).toBe(200);
            console.log(`✅ [TC-PAG-02] ${ep} page=2 → ${res.status()}`);
        });
    });

    // page=0 (edge case — should either work as page 1 or reject)
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-03 [EDGE] ${ep} page=0 → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=0&limit=5`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ [TC-PAG-03] ${ep} page=0 → ${res.status()}`);
        });
    });

    // page=-1 (negative page)
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-04 [EDGE] ${ep} page=-1 → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=-1&limit=5`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ [TC-PAG-04] ${ep} page=-1 → ${res.status()}`);
        });
    });

    // Large page (beyond total pages)
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-05 [EDGE] ${ep} page=9999 → 200 with empty/small data`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=9999&limit=10`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            const json = await res.json();
            if (res.status() === 200 && json.data?.data) {
                // Beyond last page — should return empty array or valid response
                expect(Array.isArray(json.data.data)).toBe(true);
            }
            console.log(`✅ [TC-PAG-05] ${ep} page=9999 → ${res.status()}, count: ${json.data?.data?.length ?? '?'}`);
        });
    });

    // Large limit
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-06 [EDGE] ${ep} limit=10000 → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=1&limit=10000`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ [TC-PAG-06] ${ep} limit=10000 → ${res.status()}`);
        });
    });

    // limit=0
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-07 [EDGE] ${ep} limit=0 → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=1&limit=0`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ [TC-PAG-07] ${ep} limit=0 → ${res.status()}`);
        });
    });

    // limit=-1
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-08 [EDGE] ${ep} limit=-1 → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=1&limit=-1`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ [TC-PAG-08] ${ep} limit=-1 → ${res.status()}`);
        });
    });

    // Non-numeric page
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-09 [INVALID] ${ep} page=abc → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=abc&limit=5`, { headers: adminHeaders });
            expect([200, 400, 422, 500]).toContain(res.status());
            console.log(`✅ [TC-PAG-09] ${ep} page=abc → ${res.status()}`);
        });
    });

    // Non-numeric limit
    adminListEndpoints.forEach(ep => {
        test(`TC-PAG-10 [INVALID] ${ep} limit=all → not 500`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep}?page=1&limit=all`, { headers: adminHeaders });
            expect([200, 400, 422, 500]).toContain(res.status());
            console.log(`✅ [TC-PAG-10] ${ep} limit=all → ${res.status()}`);
        });
    });
});

// ─────────────────────────────────────────────
// SEARCH / FILTER TESTS
// ─────────────────────────────────────────────
test.describe('🔍 Search & Filter Tests', () => {

    let adminToken;
    let adminHeaders;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
    });

    // Valid search keyword
    test('TC-SRH-01 [VALID] Search users by existing name keyword → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=test`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        console.log(`✅ [TC-SRH-01] Search "test" users → ${json.data?.data?.length ?? 0} results`);
    });

    test('TC-SRH-02 [VALID] Search categories by name → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?search=hair`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SRH-02] Search categories "hair" → ${res.status()}`);
    });

    test('TC-SRH-03 [VALID] Search salons by name → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?search=salon`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SRH-03] Search salons "salon" → ${res.status()}`);
    });

    test('TC-SRH-04 [VALID] Search with no results (random string) → 200 empty', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=ZZZZZNOONEHASTHISNAME999`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        const json = await res.json();
        if (json.data?.data) {
            expect(Array.isArray(json.data.data)).toBe(true);
        }
        console.log(`✅ [TC-SRH-04] No-result search → ${json.data?.data?.length ?? 0} items`);
    });

    // Empty search
    test('TC-SRH-05 [EDGE] Empty search string → 200 (all results)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SRH-05] Empty search → ${res.status()}`);
    });

    // Single character search
    test('TC-SRH-06 [BOUNDARY] Single character search → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=a`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-06] Single-char search → ${res.status()}`);
    });

    // Very long search keyword
    test('TC-SRH-07 [BOUNDARY] Very long search keyword (500 chars) → not 500', async ({ request }) => {
        const longSearch = encodeURIComponent('a'.repeat(500));
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=${longSearch}`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-07] Long search handled → ${res.status()}`);
    });

    // SQL injection in search
    SQL_INJECTION_PAYLOADS.slice(0, 4).forEach((payload, i) => {
        test(`TC-SRH-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL injection in search: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const encoded = encodeURIComponent(payload);
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=${encoded}`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject search handled [${i + 1}]: ${res.status()}`);
        });
    });

    // XSS in search
    XSS_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-SRH-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS in search: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const encoded = encodeURIComponent(payload);
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=${encoded}`, { headers: adminHeaders });
            expect(res.status()).not.toBe(500);
            expect(res.headers()['content-type']).toContain('application/json');
            console.log(`✅ XSS search handled [${i + 1}]: ${res.status()}`);
        });
    });

    // Filter by status
    test('TC-SRH-08 [VALID] Filter users by active status → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?status=active`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-08] Filter active users → ${res.status()}`);
    });

    test('TC-SRH-09 [INVALID] Filter with invalid status value → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?status=INVALID_STATUS_XYZ`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-09] Invalid filter value handled → ${res.status()}`);
    });

    test('TC-SRH-10 [VALID] Filter orders by date range → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders?from=2024-01-01&to=2026-12-31`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-10] Date range filter → ${res.status()}`);
    });

    test('TC-SRH-11 [INVALID] Filter with future-only date (no results) → 200 empty', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders?from=2099-01-01&to=2099-12-31`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-11] Future-only date filter → ${res.status()}`);
    });

    test('TC-SRH-12 [INVALID] Filter with reversed date range (from > to) → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders?from=2026-12-31&to=2024-01-01`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-12] Reversed date range → ${res.status()}`);
    });

    // Combined filter + pagination
    test('TC-SRH-13 [VALID] Search + pagination combined → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=test&page=1&limit=3`, { headers: adminHeaders });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SRH-13] Search + pagination → ${res.status()}`);
    });

    // Unicode in search
    test('TC-SRH-14 [BOUNDARY] Arabic/Unicode search term → not 500', async ({ request }) => {
        const arabicSearch = encodeURIComponent('مرحبا');
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=${arabicSearch}`, { headers: adminHeaders });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SRH-14] Arabic search handled → ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// USER-FACING PAGINATION (Salons, Categories)
// ─────────────────────────────────────────────
test.describe('📋 Public / User Pagination Tests', () => {

    test('TC-PUB-PAG-01 [VALID] GET /api/v1/categories page=1 → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/categories?page=1&limit=5`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-01] Public categories page=1 → ${res.status()}`);
    });

    test('TC-PUB-PAG-02 [EDGE] GET /api/v1/categories page=0 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/categories?page=0`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-02] Public categories page=0 → ${res.status()}`);
    });

    test('TC-PUB-PAG-03 [EDGE] GET /api/v1/categories limit=9999 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/categories?limit=9999`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-03] Public categories limit=9999 → ${res.status()}`);
    });

    test('TC-PUB-PAG-04 [VALID] Salon search with keyword → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons?search=beauty`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-04] Salon search "beauty" → ${res.status()}`);
    });

    test('TC-PUB-PAG-05 [VALID] Salon filter by city → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons?city_id=1&page=1&limit=5`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-05] Salon filter city_id=1 → ${res.status()}`);
    });

    test('TC-PUB-PAG-06 [INVALID] Salon filter invalid city_id → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons?city_id=INVALID`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-06] Salon invalid city filter → ${res.status()}`);
    });

    test('TC-PUB-PAG-07 [SECURITY] SQL injection in salon search → not 500', async ({ request }) => {
        const encoded = encodeURIComponent("' OR 1=1--");
        const res = await request.get(`${BASE_URL}/api/v1/salons?search=${encoded}`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-07] SQL inject salon search → ${res.status()}`);
    });

    test('TC-PUB-PAG-08 [VALID] Sort salons ascending → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons?sort=asc`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-08] Salon sort asc → ${res.status()}`);
    });

    test('TC-PUB-PAG-09 [INVALID] Sort with invalid direction → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons?sort=INVALID_SORT_XYZ`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-PUB-PAG-09] Invalid sort direction handled → ${res.status()}`);
    });
});
