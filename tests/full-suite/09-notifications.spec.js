// ============================================
// Full Suite: Notifications (Exhaustive DDT)
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser, createTestSalon, deleteTestSalon } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('🔔 Notifications', () => {

    let adminToken, userToken, testUser, testSalon;
    let notificationId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
        testSalon = await createTestSalon(request);
    });

    test.afterAll(async ({ request }) => {
        const H = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        if (notificationId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/notifications/${notificationId}`, { headers: H });
        }
        await deleteTestUser(request, testUser?.id);
        await deleteTestSalon(request, testSalon?.id);
    });

    // ---- Admin Notifications ----
    test('TC-NOTIF-01: Admin list notifications', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/notifications?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-NOTIF-RBAC-01: Admin list notifications with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/notifications?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test('TC-NOTIF-02: Admin create campaign notification', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/notifications/campaign-notifications`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                title_ar: 'إشعار اختبار', title_en: `Test Notification ${Date.now()}`,
                body_ar: 'محتوى الإشعار', body_en: 'Notification content for automated testing',
                type: 'all'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        notificationId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-NOTIF-CREATE-SEC-${key}: Admin create notification SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/notifications/campaign-notifications`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    title_en: typeof payload.val === 'string' ? payload.val : 'Title',
                    body_en: typeof payload.val === 'string' ? payload.val : 'Body',
                    title_ar: 'إشعار', body_ar: 'محتوى', type: 'all'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-NOTIF-03: Admin list campaign notifications', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/notifications/campaign-notifications?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    // ---- User Notifications ----
    test('TC-NOTIF-06: User list notifications', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/user/notifications?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-NOTIF-07: User mark all notifications as read', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/user/notifications/read-all`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });

    // ---- Notification Settings ----
    test('TC-NOTIF-10: Get notification settings', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/notification-settings`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });

    // ---- Salon Notifications ----
    test('TC-NOTIF-12: Salon list notifications', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/salon/notifications`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });
});
