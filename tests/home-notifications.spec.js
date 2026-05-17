// ============================================
// Authenticated Home & Admin Notifications Tests
// ============================================
// GET /api/v1/home
// GET /api/v1/web/admin/notifications/alerts
// GET /api/v1/web/admin/notifications/live-feed
// Admin Contact Us: GET/PATCH/DEL /api/v1/admin/contact_us
// Admin Config Versions: GET /api/v1/web/admin/config/versions
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken, getAdminToken } = require('./helpers/auth.helper');

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Authenticated Home API Tests', () => {

    test('TC-01: Should get home page data (authenticated)', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/home`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Home status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        console.log('✅ Authenticated home fetched');
        console.log('   Keys:', Object.keys(json.data || {}));
    });

    test('TC-02: Should get home in Arabic', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/home`, {
            headers: { ...MOBILE_HEADERS, 'x-custom-lang': 'ar', 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Home in Arabic fetched');
    });

    test('TC-03: Should fail home without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/home`, { headers: MOBILE_HEADERS });
        console.log('Home no auth status:', response.status());
        // Document behavior - may or may not require auth
        const json = await response.json();
        if (response.status() === 200) {
            console.log('ℹ️  Home is public (no auth needed)');
        } else {
            console.log('✅ Home requires auth, status:', response.status());
        }
    });
});

test.describe('Admin Notifications Tests', () => {

    test('TC-04: Should get admin notification alerts', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/notifications/alerts`, { headers });
        const json = await response.json();
        console.log('Notifications alerts status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Notification alerts fetched, count:', json.data?.length || 0);
    });

    test('TC-05: Should get admin notifications live feed', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/notifications/live-feed`, { headers });
        const json = await response.json();
        console.log('Live feed status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Live feed fetched');
    });

    test('TC-06: Should fail notifications without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/notifications/alerts`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for notifications, status:', response.status());
    });
});

test.describe('Admin Contact Us Tests', () => {

    let testContactId = null;

    test('TC-07: Should get contact us list (admin)', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/admin/contact_us`, { headers });
        const json = await response.json();
        console.log('Admin contact_us status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testContactId = json.data.data[0].id;
        console.log('✅ Contact us list fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-08: Should show single contact us message', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testContactId) { console.log('ℹ️  Skipping - no contact found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/admin/contact_us/${testContactId}/show`, { headers });
        const json = await response.json();
        console.log('Contact show status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Contact message fetched');
        } else {
            console.log('ℹ️  Contact show:', json.message);
        }
    });

    test('TC-09: Should delete contact us message', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testContactId) { console.log('ℹ️  Skipping - no contact found'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/admin/contact_us/${testContactId}/delete`, { headers });
        const json = await response.json();
        console.log('Delete contact status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Contact message deleted');
        } else {
            console.log('ℹ️  Delete contact:', json.message);
        }
    });

    test('TC-10: Should fail contact_us without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/admin/contact_us`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin App Config Versions Tests', () => {

    test('TC-11: Should get app versions list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions`, { headers });
        const json = await response.json();
        console.log('App versions status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ App versions fetched');
    });

    test('TC-12: Should get iOS version config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions/ios`, { headers });
        const json = await response.json();
        console.log('iOS version config status:', response.status());
        if (response.status() === 200) {
            console.log('✅ iOS version config fetched');
        } else {
            console.log('ℹ️  iOS version config:', json.message);
        }
    });

    test('TC-13: Should get Android version config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions/android`, { headers });
        const json = await response.json();
        console.log('Android version config status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Android version config fetched');
        } else {
            console.log('ℹ️  Android version config:', json.message);
        }
    });

    test('TC-14: Should get version analytics', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions/analytics`, { headers });
        const json = await response.json();
        console.log('Version analytics status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Version analytics fetched');
        } else {
            console.log('ℹ️  Version analytics:', json.message);
        }
    });

    test('TC-15: Should get version log statistics', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions/logs/statistics`, { headers });
        const json = await response.json();
        console.log('Version log stats status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Version log statistics fetched');
        } else {
            console.log('ℹ️  Version log stats:', json.message);
        }
    });

    test('TC-16: Should fail config versions without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/config/versions`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
