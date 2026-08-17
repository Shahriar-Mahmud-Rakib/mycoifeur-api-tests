// ============================================
// Full Suite: Salons & Salon Profile (Exhaustive DDT)
// Module: Admin / Salons, Salon / Profile, Salons (public)
// Lifecycle: create salon → test → delete salon
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestSalon, deleteTestSalon } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('💇 Salons', () => {

    let adminToken, userToken, testSalon;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        userToken = await getUserToken(request);
        testSalon = await createTestSalon(request);
    });

    test.afterAll(async ({ request }) => {
        await deleteTestSalon(request, testSalon?.id);
    });

    // ---- Admin Salon CRUD ----
    test('TC-SALON-01: Admin list all salons', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-SALON-RBAC-01: Admin list salons with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test(`TC-SALON-RBAC-02: Normal user access admin salons → 403`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons`, { 
            headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403]).toContain(res.status());
    });

    test('TC-SALON-02: Admin search salons by name (Happy Path)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?search=${testSalon.payload.fname}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-SALON-SEARCH-SEC-${key}: Admin search salons SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?search=${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-SALON-03: Admin get salon by ID', async ({ request }) => {
        if (!testSalon.id) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${testSalon.id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-SALON-GET-SEC-${key}: Admin get salon by SQLi/XSS ID (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([400, 404, 422, 500]).toContain(res.status());
        });
    }

    test('TC-SALON-04: Admin update salon', async ({ request }) => {
        if (!testSalon.id) { test.skip(); return; }
        const res = await request.put(`${BASE_URL}/api/v1/web/admin/salons/${testSalon.id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            multipart: { fname: 'Updated', lname: 'Salon', status: 'show', is_active: '1' }
        });
        expect([200]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-SALON-UPDATE-VAL-${key}: Admin update salon invalid fname (${payload.desc})`, async ({ request }) => {
            const res = await request.put(`${BASE_URL}/api/v1/web/admin/salons/${testSalon.id}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                multipart: { fname: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-SALON-06: Admin list deleted salons', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons?is_delete=1`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    // ---- Salon Profile (Salon Auth) ----
    test('TC-SALON-PROF-01: Get my salon profile', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-SALON-PROF-02: Update salon profile', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/user/salon-profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
            multipart: { fname: 'UpdatedSalon' }
        });
        expect([200, 400, 422]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-SALON-PROF-SEC-${key}: Update salon profile SQLi/XSS in fname (${payload.desc})`, async ({ request }) => {
            if (!testSalon.accessToken) { test.skip(); return; }
            const res = await request.patch(`${BASE_URL}/api/v1/user/salon-profile`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` },
                multipart: { fname: typeof payload.val === 'string' ? payload.val : 'Inject' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    // ---- Public Salon List ----
    test('TC-SALON-PUB-01: Guest list salons', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salons`, { headers: MOBILE_HEADERS });
        expect([200, 400, 401, 404, 422]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-SALON-PUB-SEARCH-SEC-${key}: Guest search salons SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/salons/search?query=${payload.val}`, { headers: MOBILE_HEADERS });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    // ---- Salon Availability ----
    test('TC-SALON-AVAIL-01: Get salon availability (web)', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/salon/availability`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });
});
