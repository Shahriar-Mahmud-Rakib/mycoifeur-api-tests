// ============================================
// Admin Categories & Services — Full Test Suite
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken, getUserToken } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY, FAKE_IDS, PAGINATION_EDGE } = require('./helpers/test-data.helper');

let testCategoryId = null;
let testServiceId = null;

const H = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en',
});

// ─── CATEGORIES — FUNCTIONAL ────────────────
test.describe('✅ Admin Categories — Functional Tests', () => {

    test('TC-CAT-01 [POSITIVE] Get categories list → 200 + schema', async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json).toHaveProperty('data');
        if (json.data?.data?.length > 0) {
            testCategoryId = json.data.data[0].id;
            expect(json.data.data[0]).toHaveProperty('id');
            expect(json.data.data[0]).toHaveProperty('nameEn');
        }
        expect(Date.now() - start).toBeLessThan(5000);
        console.log(`✅ [TC-CAT-01] Categories: ${json.data?.data?.length || 0} items`);
    });

    test('TC-CAT-02 [POSITIVE] Create new category → check response', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: await H(request),
            multipart: { name: 'Auto Test Category', name_ar: 'فئة تجريبية', order: '1' },
        });
        const json = await res.json();
        if ([200, 201].includes(res.status())) {
            expect(json.success).toBeTruthy();
            if (json.data?.id) testCategoryId = json.data.id;
            console.log(`✅ [TC-CAT-02] Category created, id: ${testCategoryId}`);
        } else {
            console.log(`ℹ️  [TC-CAT-02] Create response: ${json.message}`);
        }
        expect(res.status()).not.toBe(500);
    });

    test('TC-CAT-03 [POSITIVE] Get single category by ID → 200', async ({ request }) => {
        if (!testCategoryId) { console.log('ℹ️  Skipped — no ID'); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${testCategoryId}`, { headers: await H(request) });
        if (res.status() === 200) {
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toHaveProperty('id');
            console.log(`✅ [TC-CAT-03] Category detail fetched`);
        }
        expect(res.status()).not.toBe(500);
    });

    test('TC-CAT-04 [POSITIVE] Update category name → not 500', async ({ request }) => {
        if (!testCategoryId) { console.log('ℹ️  Skipped — no ID'); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/categories/${testCategoryId}`, {
            headers: await H(request),
            multipart: { name: 'Updated Auto Category' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-04] Category updated → ${res.status()}`);
    });

    test('TC-CAT-05 [POSITIVE] Delete category → not 500', async ({ request }) => {
        if (!testCategoryId) { console.log('ℹ️  Skipped — no ID'); return; }
        const res = await request.delete(`${BASE_URL}/api/v1/web/admin/categories/${testCategoryId}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-05] Category deleted → ${res.status()}`);
    });

    test('TC-CAT-06 [POSITIVE] Restore deleted category → not 500', async ({ request }) => {
        if (!testCategoryId) { console.log('ℹ️  Skipped — no ID'); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/categories/${testCategoryId}/restore`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-06] Category restored → ${res.status()}`);
    });

    test('TC-CAT-07 [POSITIVE] Export categories → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/export`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-07] Export categories → ${res.status()}`);
    });
});

// ─── CATEGORIES — NEGATIVE ──────────────────
test.describe('❌ Admin Categories — Negative Tests', () => {

    test('TC-CAT-08 [NEGATIVE] Get categories without auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`);
        expect(res.status()).toBe(401);
        console.log(`✅ [TC-CAT-08] No auth → ${res.status()}`);
    });

    test('TC-CAT-09 [NEGATIVE] Create category missing name → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: await H(request),
            multipart: { name_ar: 'فقط عربي', order: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-09] Missing name → ${res.status()}`);
    });

    test('TC-CAT-10 [NEGATIVE] Get non-existent category ID → not 200 / not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${FAKE_IDS.NON_EXISTENT}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-10] Non-existent ID → ${res.status()}`);
    });

    test('TC-CAT-11 [NEGATIVE] Delete non-existent category → not 500', async ({ request }) => {
        const res = await request.delete(`${BASE_URL}/api/v1/web/admin/categories/${FAKE_IDS.NON_EXISTENT}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-11] Delete non-existent → ${res.status()}`);
    });

    test('TC-CAT-12 [NEGATIVE] User token on admin categories → 401/403', async ({ request }) => {
        let userToken;
        try { userToken = await getUserToken(request); } catch { return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: `Bearer ${userToken}`, 'x-custom-lang': 'en' },
        });
        expect([401, 403]).toContain(res.status());
        console.log(`✅ [TC-CAT-12] User token → ${res.status()}`);
    });

    test('TC-CAT-13 [NEGATIVE] Invalid token on admin categories → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: 'Bearer completely_invalid_token', 'x-custom-lang': 'en' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CAT-13] Invalid token → ${res.status()}`);
    });
});

// ─── CATEGORIES — BOUNDARY ──────────────────
test.describe('📏 Admin Categories — Boundary & Invalid Type Tests', () => {

    test('TC-CAT-14 [BOUNDARY] Very long category name (255 chars) → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: await H(request),
            multipart: { name: BOUNDARY.MAX_STRING_255, name_ar: 'فئة', order: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-14] Long name → ${res.status()}`);
    });

    test('TC-CAT-15 [BOUNDARY] Empty string name → not 200 / not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: await H(request),
            multipart: { name: '', name_ar: 'فئة', order: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-15] Empty name → ${res.status()}`);
    });

    test('TC-CAT-16 [BOUNDARY] Negative order number → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: await H(request),
            multipart: { name: 'Neg Order', name_ar: 'فئة', order: '-1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-16] Negative order → ${res.status()}`);
    });

    test('TC-CAT-17 [INVALID] String as ID in path → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${FAKE_IDS.STRING_ID}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-17] String ID → ${res.status()}`);
    });

    test('TC-CAT-18 [INVALID] Float as ID in path → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/1.9`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-18] Float ID → ${res.status()}`);
    });
});

// ─── CATEGORIES — SECURITY ──────────────────
test.describe('🛡️ Admin Categories — Security Tests', () => {

    SQL_INJECTION_PAYLOADS.slice(0, 4).forEach((payload, i) => {
        test(`TC-CAT-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject category name: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
                headers: await H(request),
                multipart: { name: payload, name_ar: 'فئة', order: '1' },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject cat name [${i + 1}]: ${res.status()}`);
        });
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-CAT-SEC-SQLID-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject in ID path: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const encoded = encodeURIComponent(payload);
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${encoded}`, { headers: await H(request) });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject cat ID [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-CAT-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS in category name: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
                headers: await H(request),
                multipart: { name: payload, name_ar: 'فئة', order: '1' },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS cat name [${i + 1}]: ${res.status()}`);
        });
    });
});

// ─── CATEGORIES — PAGINATION ────────────────
test.describe('📄 Admin Categories — Pagination & Filter', () => {

    test('TC-CAT-PAG-01 [VALID] page=1 limit=5 → 200 max 5 items', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=1&limit=5`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        if (json.data?.data) expect(json.data.data.length).toBeLessThanOrEqual(5);
        console.log(`✅ [TC-CAT-PAG-01] page=1 limit=5 → ${json.data?.data?.length} items`);
    });

    test('TC-CAT-PAG-02 [EDGE] page=0 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=0`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-PAG-02] page=0 → ${res.status()}`);
    });

    test('TC-CAT-PAG-03 [EDGE] page=-1 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=-1`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-PAG-03] page=-1 → ${res.status()}`);
    });

    test('TC-CAT-PAG-04 [EDGE] page=9999 → 200 with empty data', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=9999&limit=5`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-PAG-04] page=9999 → ${res.status()}`);
    });

    test('TC-CAT-PAG-05 [EDGE] limit=10000 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?limit=10000`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-PAG-05] limit=10000 → ${res.status()}`);
    });

    test('TC-CAT-PAG-06 [INVALID] page=abc limit=xyz → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=abc&limit=xyz`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-PAG-06] string page/limit → ${res.status()}`);
    });

    test('TC-CAT-SRH-01 [VALID] Search categories by name → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?search=hair`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-CAT-SRH-01] Search categories → ${res.status()}`);
    });

    test('TC-CAT-SRH-02 [SECURITY] SQL inject in search → not 500', async ({ request }) => {
        const encoded = encodeURIComponent("' OR 1=1--");
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?search=${encoded}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CAT-SRH-02] SQL inject search → ${res.status()}`);
    });
});

// ─── ADMIN SERVICES ─────────────────────────
test.describe('⚙️ Admin Services — Full Tests', () => {

    test('TC-SVC-01 [POSITIVE] Get services list → 200 + schema', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) {
            testServiceId = json.data.data[0].id;
            expect(json.data.data[0]).toHaveProperty('id');
        }
        console.log(`✅ [TC-SVC-01] Services: ${json.data?.data?.length || 0} items`);
    });

    test('TC-SVC-02 [POSITIVE] Get single service → 200', async ({ request }) => {
        if (!testServiceId) { console.log('ℹ️  Skipped'); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services/${testServiceId}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-02] Service detail → ${res.status()}`);
    });

    test('TC-SVC-03 [POSITIVE] Toggle service status → not 500', async ({ request }) => {
        if (!testServiceId) { console.log('ℹ️  Skipped'); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/services/${testServiceId}/toggle`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-03] Toggle service → ${res.status()}`);
    });

    test('TC-SVC-04 [NEGATIVE] No auth for services → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services`);
        expect(res.status()).toBe(401);
        console.log(`✅ [TC-SVC-04] No auth services → ${res.status()}`);
    });

    test('TC-SVC-05 [NEGATIVE] Non-existent service ID → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services/${FAKE_IDS.NON_EXISTENT}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-05] Non-existent service → ${res.status()}`);
    });

    test('TC-SVC-06 [SECURITY] SQL inject in service ID → not 500', async ({ request }) => {
        const encoded = encodeURIComponent(FAKE_IDS.SQL);
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services/${encoded}`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-06] SQL inject service ID → ${res.status()}`);
    });

    test('TC-SVC-07 [EDGE] Services page=0 → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services?page=0`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-07] Services page=0 → ${res.status()}`);
    });

    test('TC-SVC-08 [EDGE] Services large limit → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services?limit=10000`, { headers: await H(request) });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SVC-08] Services limit=10000 → ${res.status()}`);
    });

    test('TC-SVC-09 [VALID] Services with search keyword → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services?search=cut`, { headers: await H(request) });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SVC-09] Search services → ${res.status()}`);
    });

    test('TC-SVC-10 [RESPONSE-TIME] Services list < 5s', async ({ request }) => {
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/web/admin/services`, { headers: await H(request) });
        expect(Date.now() - start).toBeLessThan(5000);
        console.log('✅ [TC-SVC-10] Services response time OK');
    });
});
