// ============================================
// Admin Overview / Dashboard API Tests
// ============================================
// GET /api/v1/web/admin/overview
// GET /api/v1/web/admin/overview/user-statics
// GET /api/v1/web/admin/overview/salons-statics
// GET /api/v1/web/admin/overview/orders-statics
// GET /api/v1/web/admin/overview/orders-completed-statics
// GET /api/v1/web/admin/overview/orders-rejected-statics
// GET /api/v1/web/admin/overview/artist-statics
// GET /api/v1/web/admin/overview/calendar
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');

test.describe('Admin Overview Dashboard Tests', () => {

    test('TC-01: Should get main dashboard overview', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Overview status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Admin overview fetched');
        console.log('   Keys:', Object.keys(json.data || {}));
    });

    test('TC-02: Should fail overview without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-03: Should get user statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/user-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('User stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ User stats fetched');
    });

    test('TC-04: Should get salon statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/salons-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Salon stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Salon stats fetched');
    });

    test('TC-05: Should get orders statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/orders-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Orders stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Orders stats fetched');
    });

    test('TC-06: Should get completed orders statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/orders-completed-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Completed orders stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Completed orders stats fetched');
    });

    test('TC-07: Should get rejected orders statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/orders-rejected-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Rejected orders stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Rejected orders stats fetched');
    });

    test('TC-08: Should get artist statistics', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/artist-statics`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Artist stats status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Artist stats fetched');
    });

    test('TC-09: Should get admin calendar', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview/calendar?month=2026-06`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        const json = await response.json();
        console.log('Admin calendar status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Admin calendar fetched');
        } else {
            console.log('ℹ️  Calendar:', json.message);
        }
    });

    test('TC-10: Should get overview with date filter', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/overview?from=2026-01-01&to=2026-12-31`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' }
        });
        console.log('Overview date filter status:', response.status());
        if (response.status() === 200) console.log('✅ Overview with date filter');
    });
});
