// ============================================
// Full Suite: Locations, App Config, Settings (Exhaustive DDT)
// Module: Locations, App Config, Admin / Settings, Admin / App Versions
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🌍 Locations', () => {

    test('TC-LOC-01: Get all countries', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/locations/countries`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(200);
    });

    test('TC-LOC-02: Get states (all)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/locations/states`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(200);
    });

    test('TC-LOC-03: Get states filtered by country_id', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/locations/states?country_id=1`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-LOC-STATES-SEC-${key}: Get states with SQLi/XSS in country_id (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/locations/states?country_id=${payload.val}`, { headers: MOBILE_HEADERS });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-LOC-04: Get cities', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/locations/cities`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(200);
    });

    test('TC-LOC-05: Get districts', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/locations/districts`, { headers: MOBILE_HEADERS });
        expect([200]).toContain(res.status());
    });
});

test.describe('⚙️ App Config', () => {

    test('TC-CONFIG-01: Get app version info (android)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/config/version?platform=android`, { headers: MOBILE_HEADERS });
        expect([200, 404]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-CONFIG-SEC-${key}: Get app version with SQLi/XSS platform (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/config/version?platform=${payload.val}`, { headers: MOBILE_HEADERS });
            expect([200, 400, 422, 404, 500]).toContain(res.status());
        });
    }

    test('TC-CONFIG-03: Check version (up to date)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/config/check-version`, {
            headers: MOBILE_HEADERS,
            data: { platform: 'android', version: '9.9.9' }
        });
        expect([200, 201, 400, 426]).toContain(res.status());
    });

    test('TC-CONFIG-04: Record analytics', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/config/analytics`, {
            headers: MOBILE_HEADERS,
            data: { platform: 'android', appVersion: '1.1.9', deviceId: `test-device-${Date.now()}` }
        });
        expect([200, 400, 422]).toContain(res.status());
    });

    test('TC-CONFIG-06: Missing version in check-version → 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/config/check-version`, {
            headers: MOBILE_HEADERS,
            data: { platform: 'android' } // missing version
        });
        expect([400, 422]).toContain(res.status());
    });
});

test.describe('🛠️ Admin / Settings', () => {

    let adminToken, userToken;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        userToken = await getUserToken(request);
    });

    test('TC-SETTINGS-01: Get system settings', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-SETTINGS-RBAC-01: Admin settings with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test(`TC-SETTINGS-RBAC-02: Normal user access admin settings → 403`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings`, { 
            headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403]).toContain(res.status());
    });

    test('TC-SETTINGS-02: Get booking reject reasons', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/settings/booking-reject-reasons`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });
});

test.describe('📱 Admin / App Versions', () => {

    let adminToken;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
    });

    test('TC-APPVER-01: Get all app versions', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-APPVER-02: Get app version analytics', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions/analytics`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });
});
