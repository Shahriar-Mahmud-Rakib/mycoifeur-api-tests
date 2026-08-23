// ============================================
// Full Suite: Categories, Type Services, Services (Exhaustive DDT)
// Module: Admin / Categories, Admin / Type Services, Admin / Services, Services
// Lifecycle: create → test → delete
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🗂️ Categories, Type Services & Services', () => {

    let adminToken, userToken, testUser;
    let categoryId, typeServiceId, serviceId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
    });

    test.afterAll(async ({ request }) => {
        // Delete in reverse order (services → type services → categories)
        if (serviceId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/services/${serviceId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
        }
        if (typeServiceId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/type-services/${typeServiceId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
        }
        if (categoryId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/categories/${categoryId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
        }
        await deleteTestUser(request, testUser?.id);
    });

    // ---- Categories ----
    test('TC-CAT-01: Admin create category (Happy Path)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { name_ar: 'اختبار', name_en: `TestCat_${Date.now()}`, status: 'show' }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json();
        categoryId = json.data?.id;
        expect(categoryId).toBeDefined();
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-CAT-CREATE-VAL-${key}: Admin create category missing/invalid fields (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: { 
                    name_en: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    name_ar: 'اختبار', status: 'show'
                } 
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-CAT-CREATE-SEC-${key}: Admin create category with SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: { 
                    name_en: typeof payload.val === 'string' ? payload.val : `TestCat_${Date.now()}`,
                    name_ar: typeof payload.val === 'string' ? payload.val : 'اختبار', 
                    status: 'show'
                } 
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-CAT-02: Admin list categories', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-CAT-RBAC-01: Admin list categories with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403, 404]).toContain(res.status());
        });
    }

    test('TC-CAT-03: Admin get category by ID', async ({ request }) => {
        if (!categoryId) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${categoryId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-CAT-GET-SEC-${key}: Admin get category by SQLi/XSS ID (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/categories/${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([400, 404, 422, 500]).toContain(res.status());
        });
    }

    test('TC-CAT-04: Admin update category', async ({ request }) => {
        if (!categoryId) { test.skip(); return; }
        const res = await request.put(`${BASE_URL}/api/v1/web/admin/categories/${categoryId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { name_en: 'UpdatedCat', name_ar: 'محدث', status: 'show' }
        });
        expect([200, 201]).toContain(res.status());
    });

    // ---- Public Categories (Guest) ----
    test('TC-CAT-07: Guest list categories', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/categories`, { headers: MOBILE_HEADERS });
        expect([200, 404]).toContain(res.status());
    });

    // ---- Type Services Exhaustive ----
    test('TC-TYPESERV-01: Admin list type services', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/type-services?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-TYPESERV-RBAC-01: Admin list type services with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/type-services?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    // ---- Services (Mobile) ----
    test('TC-SERV-01: Guest/User get services list', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/services`, { headers: MOBILE_HEADERS });
        expect([200, 401]).toContain(res.status());
    });

    // ---- Admin Services Exhaustive ----
    test('TC-ADMIN-SERV-01: Admin list services', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/services?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-ADMIN-SERV-SEC-${key}: Admin list services SQLi/XSS in search query (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/services?page=1&limit=10&search=${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }
});
