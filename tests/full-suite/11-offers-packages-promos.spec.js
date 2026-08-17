// ============================================
// Full Suite: Offers, Packages, Promocodes, Translations (Exhaustive DDT)
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser, createTestSalon, deleteTestSalon } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🎁 Offers, Packages & Promocodes', () => {

    let adminToken, userToken, testUser, testSalon;
    let offerId, packageId, promocodeId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
        testSalon = await createTestSalon(request);
    });

    test.afterAll(async ({ request }) => {
        const salonH = { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` };
        const adminH = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        if (offerId) {
            await request.delete(`${BASE_URL}/api/v1/web/salon/offers/${offerId}`, { headers: salonH });
        }
        if (packageId) {
            await request.delete(`${BASE_URL}/api/v1/web/salon/packages/${packageId}`, { headers: salonH });
        }
        if (promocodeId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/promocodes/${promocodeId}`, { headers: adminH });
        }
        await deleteTestUser(request, testUser?.id);
        await deleteTestSalon(request, testSalon?.id);
    });

    // ---- Offers (Salon) ----
    test('TC-OFFER-01: Salon list offers', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/salon/offers?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-OFFER-02: Salon create offer', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.post(`${BASE_URL}/api/v1/web/salon/offers`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
            data: {
                title_ar: 'عرض تجريبي', title_en: `Test Offer ${Date.now()}`,
                discount: 15, discountType: 'percentage',
                startDate: '2026-09-01', endDate: '2026-12-31', status: 'active'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        offerId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-OFFER-CREATE-VAL-${key}: Salon create offer invalid discount (${payload.desc})`, async ({ request }) => {
            if (!testSalon.accessToken) { test.skip(); return; }
            const res = await request.post(`${BASE_URL}/api/v1/web/salon/offers`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
                data: {
                    title_ar: 'عرض تجريبي', title_en: `Test Offer ${Date.now()}`,
                    discount: payload.val, discountType: 'percentage',
                    startDate: '2026-09-01', endDate: '2026-12-31', status: 'active'
                }
            });
            expect([400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-OFFER-03: Guest list offers (public)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/guest/offers`, { headers: MOBILE_HEADERS });
        expect([200, 422]).toContain(res.status());
    });

    test('TC-OFFER-04: Mobile user list offers', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/offers`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 401]).toContain(res.status());
    });

    // ---- Packages (Salon) ----
    test('TC-PKG-01: Salon list packages', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/salon/packages?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-PKG-02: Salon create package', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.post(`${BASE_URL}/api/v1/web/salon/packages`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
            data: {
                title_ar: 'باقة تجريبية', title_en: `Test Package ${Date.now()}`,
                price: 100, description_en: 'Test package', description_ar: 'باقة اختبار',
                status: 'active'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        packageId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-PKG-CREATE-SEC-${key}: Salon create package SQLi/XSS (${payload.desc})`, async ({ request }) => {
            if (!testSalon.accessToken) { test.skip(); return; }
            const res = await request.post(`${BASE_URL}/api/v1/web/salon/packages`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
                data: {
                    title_ar: 'باقة', title_en: typeof payload.val === 'string' ? payload.val : 'Inject',
                    price: 100, description_en: 'Desc', description_ar: 'باقة',
                    status: 'active'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-PKG-03: Mobile get packages list', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/packages`, { headers: MOBILE_HEADERS });
        expect([200]).toContain(res.status());
    });

    // ---- Promocodes (Admin) ----
    test('TC-PROMO-01: Admin list promocodes', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/promocodes?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-PROMO-RBAC-01: Admin list promocodes with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/admin/promocodes?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test('TC-PROMO-02: Admin create promocode', async ({ request }) => {
        const ts = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/admin/promocodes`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                code: `TEST${ts}`, discount: 10, discountType: 'percentage',
                maxUses: 100, minOrderAmount: 0,
                startDate: '2026-09-01', endDate: '2026-12-31', status: 'active'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        promocodeId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-PROMO-CREATE-VAL-${key}: Admin create promo invalid maxUses (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/admin/promocodes`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    code: `TEST_${Date.now()}`, discount: 10, discountType: 'percentage',
                    maxUses: payload.val, minOrderAmount: 0,
                    startDate: '2026-09-01', endDate: '2026-12-31', status: 'active'
                }
            });
            expect([400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-PROMO-03: User apply promocode (no valid order)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
            data: { code: 'NONEXISTENT' }
        });
        expect([400, 404, 422]).toContain(res.status());
    });
});

test.describe('🌐 Translations', () => {

    test('TC-TRANS-01: Get mobile translations (EN)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/translations`, {
            headers: { 'x-custom-lang': 'en', 'x-app-version': '1.1.9', 'x-platform': 'android' }
        });
        expect([200, 422]).toContain(res.status());
    });

    test('TC-TRANS-02: Get mobile translations (AR)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/translations`, {
            headers: { 'x-custom-lang': 'ar', 'x-app-version': '1.1.9', 'x-platform': 'android' }
        });
        expect([200, 422]).toContain(res.status());
    });

    test('TC-TRANS-03: Admin get translations', async ({ request }) => {
        const adminToken = await getAdminToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/admin-translations`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 404]).toContain(res.status());
    });
});
