// ============================================
// Full Suite: Orders, Addresses & Disputes (Exhaustive DDT)
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser, createTestSalon, deleteTestSalon } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('📦 Orders, Addresses & Disputes', () => {

    let adminToken, userToken, testUser, testSalon;
    let addressId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
        testSalon = await createTestSalon(request);
    });

    test.afterAll(async ({ request }) => {
        // Address delete uses GET /address/{id}/delete (unusual but per swagger)
        if (addressId) {
            await request.get(`${BASE_URL}/api/v1/address/${addressId}/delete`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
            });
        }
        await deleteTestUser(request, testUser?.id);
        await deleteTestSalon(request, testSalon?.id);
    });

    // ---- Customer Address ----
    test('TC-ADDR-01: User create address', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/address/create`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
            data: {
                countryId: 1, cityId: 1, stateId: 1,
                lat: '24.7136', long: '46.6753',
                address: 'Riyadh, King Fahd Road',
                addressType: 'home', label: 'Home'
            }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        addressId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-ADDR-CREATE-VAL-${key}: User create address missing/invalid Lat (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/address/create`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
                data: {
                    countryId: 1, cityId: 1, stateId: 1,
                    lat: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    long: '46.6753', address: 'Test', addressType: 'home', label: 'Home'
                }
            });
            expect([400, 422, 500]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-ADDR-CREATE-SEC-${key}: User create address SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/address/create`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
                data: {
                    countryId: 1, cityId: 1, stateId: 1, lat: '24.7136', long: '46.6753',
                    address: typeof payload.val === 'string' ? payload.val : 'Test Addr',
                    addressType: 'home', label: 'Inject'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-ADDR-02: User list addresses', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/address`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-ADDR-03: User get address by ID', async ({ request }) => {
        if (!addressId) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/address/${addressId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });

    test('TC-ADDR-04: User update address', async ({ request }) => {
        if (!addressId) { test.skip(); return; }
        const res = await request.post(`${BASE_URL}/api/v1/address/update`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
            data: { id: addressId, label: 'Work', addressType: 'work' }
        });
        expect([200, 400, 422]).toContain(res.status());
    });

    // ---- Customer Orders ----
    test('TC-ORDER-01: User list active orders', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/orders/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- Admin Orders ----
    test('TC-ADMIN-ORDER-01: Admin list all orders', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-ADMIN-ORDER-RBAC-01: Admin list orders with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test(`TC-ADMIN-ORDER-RBAC-02: Normal user access admin orders → 403`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders`, { 
            headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403]).toContain(res.status());
    });

    test('TC-ADMIN-ORDER-02: Admin list pending orders', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders/pending?limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-ADMIN-ORDER-03: Admin list carts', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders/carts?limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-ADMIN-ORDER-CART-SEC-${key}: Admin list carts SQLi/XSS in limit (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/orders/carts?limit=${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    // ---- Salon Orders ----
    test('TC-SALON-ORDER-01: Salon list orders', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/salon/orders/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- Disputes ----
    test('TC-DISPUTE-01: Admin list disputes', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/disputes?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-DISPUTE-02: User list disputes', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/app/disputes?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });
});
