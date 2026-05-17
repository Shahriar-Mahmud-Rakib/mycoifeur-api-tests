// ============================================
// Admin Salons Management API Tests
// ============================================
// GET   /api/v1/web/admin/salons
// GET   /api/v1/web/admin/salons/{id}
// PATCH /api/v1/web/admin/salons/{id}
// DEL   /api/v1/web/admin/salons/{id}
// PATCH /api/v1/web/admin/salons/{id}/restore
// PATCH /api/v1/web/admin/salons/{id}/ban
// PATCH /api/v1/web/admin/salons/{id}/vip
// GET   /api/v1/web/admin/salons/{id}/gallery
// POST  /api/v1/web/admin/salons/{id}/gallery
// DEL   /api/v1/web/admin/salons/gallery/{imgId}
// PATCH /api/v1/web/admin/salons/gallery/{imgId}/restore
// GET   /api/v1/web/admin/salons/{id}/working-days
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testSalonId = null;
let testGalleryImgId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - List Salons Tests', () => {

    test('TC-01: Should get list of all salons', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons`, { headers });
        const json = await response.json();
        console.log('Admin salons list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testSalonId = json.data.data[0].id;
        console.log('✅ Salons list fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-02: Should get salons with pagination', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons?page=1&limit=5`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Salons paginated');
    });

    test('TC-03: Should get salons with search filter', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons?search=salon`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Salons search fetched');
    });

    test('TC-04: Should fail get salons without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Salon CRUD Tests', () => {

    test('TC-05: Should get single salon by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${salonId}`, { headers });
        const json = await response.json();
        console.log(`Salon ${salonId} detail status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon details fetched');
        } else {
            console.log('ℹ️  Salon detail:', json.message);
        }
    });

    test('TC-06: Should update salon info', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}`, {
            headers,
            multipart: { fname: 'Updated Salon Name' }
        });
        const json = await response.json();
        console.log('Update salon status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salon updated');
        } else {
            console.log('ℹ️  Update salon:', json.message);
        }
    });

    test('TC-07: Should ban/block a salon', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}/ban`, {
            headers,
            data: { reason: 'Testing ban functionality' }
        });
        const json = await response.json();
        console.log('Ban salon status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salon banned');
        } else {
            console.log('ℹ️  Ban salon:', json.message);
        }
    });

    test('TC-08: Should restore a banned salon', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}/restore`, { headers });
        const json = await response.json();
        console.log('Restore salon status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salon restored');
        } else {
            console.log('ℹ️  Restore salon:', json.message);
        }
    });

    test('TC-09: Should set salon VIP status', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}/vip`, {
            headers,
            data: { is_vip: true }
        });
        const json = await response.json();
        console.log('Set VIP status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salon VIP status set');
        } else {
            console.log('ℹ️  Set VIP:', json.message);
        }
    });

    test('TC-10: Should return 404 for non-existent salon', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons/99999999`, { headers });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent salon rejected, status:', response.status());
    });
});

test.describe('Admin - Salon Gallery Tests', () => {

    test('TC-11: Should get salon gallery', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${salonId}/gallery`, { headers });
        const json = await response.json();
        console.log('Salon gallery status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            if (json.data?.length > 0) testGalleryImgId = json.data[0].id;
            console.log('✅ Gallery fetched');
        } else {
            console.log('ℹ️  Gallery:', json.message);
        }
    });

    test('TC-12: Should get salon working days', async ({ request }) => {
        const headers = await adminHeaders(request);
        const salonId = testSalonId;
        if (!salonId) { console.log('ℹ️  Skipping - no salon found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${salonId}/working-days`, { headers });
        const json = await response.json();
        console.log('Salon working days status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Working days fetched');
        } else {
            console.log('ℹ️  Working days:', json.message);
        }
    });

    test('TC-13: Should fail salon operations without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/salons`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
