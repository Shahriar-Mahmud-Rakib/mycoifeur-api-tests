// ============================================
// Full Suite: Payouts, Commissions, Reports, File Galleries (Exhaustive DDT)
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser, createTestSalon, deleteTestSalon } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('💸 Payouts, Commissions & File Management', () => {

    let adminToken, userToken, testUser, testSalon;
    let fileGalleryId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
        testSalon = await createTestSalon(request);
    });

    test.afterAll(async ({ request }) => {
        const adminH = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        if (fileGalleryId) {
            await request.delete(`${BASE_URL}/api/v1/admin/file-galleries/${fileGalleryId}`, { headers: adminH });
        }
        await deleteTestUser(request, testUser?.id);
        await deleteTestSalon(request, testSalon?.id);
    });

    // ---- Admin Payouts ----
    test('TC-PAYOUT-01: Admin list all payouts', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/payouts?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-PAYOUT-RBAC-01: Admin list payouts with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/payouts?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test('TC-PAYOUT-02: Admin payouts with status filter', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/payouts?status=pending&limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-PAYOUT-STATUS-SEC-${key}: Admin payouts SQLi/XSS in status (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/payouts?status=${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([200, 400, 422, 500]).toContain(res.status());
        });
    }

    // ---- Provider Payouts ----
    test('TC-PAYOUT-03: Salon list payout history', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/provider/payouts?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-PAYOUT-04: Salon payout summary', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/provider/payouts/summary`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- Admin Commissions ----
    test('TC-COMM-01: Admin list commissions', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/commissions?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    test(`TC-COMM-RBAC-01: Normal user access admin commissions → 403`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/commissions`, { 
            headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403]).toContain(res.status());
    });

    // ---- Salon Commissions ----
    test('TC-COMM-02: Salon list own commissions', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/salon/commissions?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- Admin Reports ----
    test('TC-REPORT-01: Admin list reports (orders)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/reports?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 404]).toContain(res.status());
    });

    // ---- File Galleries ----
    test('TC-FILEGALLERY-01: Admin create file gallery entry', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/admin/file-galleries`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                table_name: 'users', field_id: testUser.id, field_name: 'gallery',
                file_url: 'https://example.com/test-image.jpg', file_type: 'image/jpeg'
            }
        });
        expect([200, 201, 400]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        fileGalleryId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-FILEGALLERY-CREATE-SEC-${key}: Admin file gallery SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/admin/file-galleries`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    table_name: typeof payload.val === 'string' ? payload.val : 'users', 
                    field_id: 1, field_name: 'gallery',
                    file_url: 'https://example.com/test.jpg', file_type: 'image/jpeg'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-FILEGALLERY-02: Admin get file galleries by table/field', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/file-galleries?table_name=users&field_id=${testUser.id}&field_name=gallery`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 400]).toContain(res.status());
    });

    test('TC-FILEGALLERY-03: Mobile get file galleries', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/file-galleries?table_name=users&field_id=1&field_name=gallery`, {
            headers: MOBILE_HEADERS
        });
        expect([200, 400]).toContain(res.status());
    });

    // ---- Admin / Earnings ----
    test('TC-EARNINGS-01: Admin earnings', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/earnings?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 404]).toContain(res.status());
    });

    test('TC-EARNINGS-02: Provider earnings', async ({ request }) => {
        if (!testSalon.accessToken) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/provider/earnings?page=1&limit=10`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testSalon.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });
});
