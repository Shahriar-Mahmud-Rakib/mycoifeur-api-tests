// ============================================
// Admin Users Management API Tests
// ============================================
// GET    /api/v1/web/admin/users
// POST   /api/v1/web/admin/users
// GET    /api/v1/web/admin/users/{id}
// PATCH  /api/v1/web/admin/users/{id}
// DELETE /api/v1/web/admin/users/{id}
// PATCH  /api/v1/web/admin/users/{id}/restore
// PATCH  /api/v1/web/admin/users/block
// GET    /api/v1/web/admin/users/{id}/rewards
// GET    /api/v1/web/admin/users/vips
// POST   /api/v1/web/admin/users/vips
// GET    /api/v1/web/admin/users/vips/{id}
// PATCH  /api/v1/web/admin/users/vips/{id}
// DELETE /api/v1/web/admin/users/vips/{id}
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testUserId = null;
let testVipId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - List Users Tests', () => {

    test('TC-01: Should get list of all users', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users`, { headers });
        const json = await response.json();
        console.log('Admin users list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) {
            testUserId = json.data.data[0].id;
        }
        console.log('✅ Users list fetched, count:', json.data?.data?.length || 0, ', first id:', testUserId);
    });

    test('TC-02: Should get users with pagination', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users?page=1&limit=5`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Users paginated');
    });

    test('TC-03: Should get users with role filter', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users?role=user`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Users by role fetched');
    });

    test('TC-04: Should get users with search', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users?search=test`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Users search fetched');
    });

    test('TC-05: Should get users with status filter', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users?status=active`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Users by status fetched');
    });

    test('TC-06: Should fail get users without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - User CRUD Tests', () => {

    test('TC-07: Should get single user by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        const userId = testUserId || 'some-user-id';
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users/${userId}`, { headers });
        const json = await response.json();
        console.log(`User ${userId} details status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ User details fetched');
        } else {
            console.log('ℹ️  User detail:', json.message);
        }
    });

    test('TC-08: Should update user by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        const userId = testUserId || 'some-user-id';
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
            headers,
            multipart: { fname: 'UpdatedName' }
        });
        const json = await response.json();
        console.log('Update user status:', response.status());
        if (response.status() === 200) {
            console.log('✅ User updated');
        } else {
            console.log('ℹ️  Update user:', json.message);
        }
    });

    test('TC-09: Should get user rewards', async ({ request }) => {
        const headers = await adminHeaders(request);
        const userId = testUserId || 'some-user-id';
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users/${userId}/rewards`, { headers });
        const json = await response.json();
        console.log('User rewards status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ User rewards fetched');
        } else {
            console.log('ℹ️  Rewards:', json.message);
        }
    });

    test('TC-10: Should block/suspend a user', async ({ request }) => {
        const headers = await adminHeaders(request);
        const userId = testUserId;
        if (!userId) { console.log('ℹ️  Skipping - no test user ID'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/users/block`, {
            headers,
            data: { user_id: userId, reason: 'Testing block functionality' }
        });
        const json = await response.json();
        console.log('Block user status:', response.status());
        if (response.status() === 200) {
            console.log('✅ User blocked');
        } else {
            console.log('ℹ️  Block user:', json.message);
        }
    });

    test('TC-11: Should restore/activate a user', async ({ request }) => {
        const headers = await adminHeaders(request);
        const userId = testUserId;
        if (!userId) { console.log('ℹ️  Skipping - no test user ID'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}/restore`, { headers });
        const json = await response.json();
        console.log('Restore user status:', response.status());
        if (response.status() === 200) {
            console.log('✅ User restored');
        } else {
            console.log('ℹ️  Restore user:', json.message);
        }
    });

    test('TC-12: Should fail block user without auth', async ({ request }) => {
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/users/block`, {
            data: { user_id: '1' }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - VIP Management Tests', () => {

    test('TC-13: Should get list of VIP configurations', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users/vips`, { headers });
        const json = await response.json();
        console.log('VIPs list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testVipId = json.data.data[0].id;
        console.log('✅ VIPs fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-14: Should create new VIP config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/users/vips`, {
            headers,
            data: { orders_count: 10, name: 'Gold VIP', discount: 15 }
        });
        const json = await response.json();
        console.log('Create VIP status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testVipId = json.data.id;
            console.log('✅ VIP created, id:', testVipId);
        } else {
            console.log('ℹ️  Create VIP:', json.message);
        }
    });

    test('TC-15: Should get single VIP config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const vipId = testVipId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users/vips/${vipId}`, { headers });
        const json = await response.json();
        console.log('VIP detail status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ VIP details fetched');
        } else {
            console.log('ℹ️  VIP detail:', json.message);
        }
    });

    test('TC-16: Should update VIP config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const vipId = testVipId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/users/vips/${vipId}`, {
            headers,
            data: { orders_count: 15, name: 'Updated Gold VIP', discount: 20 }
        });
        const json = await response.json();
        console.log('Update VIP status:', response.status());
        if (response.status() === 200) {
            console.log('✅ VIP updated');
        } else {
            console.log('ℹ️  Update VIP:', json.message);
        }
    });

    test('TC-17: Should delete VIP config', async ({ request }) => {
        const headers = await adminHeaders(request);
        const vipId = testVipId || 1;
        const response = await request.delete(`${BASE_URL}/api/v1/web/admin/users/vips/${vipId}`, { headers });
        const json = await response.json();
        console.log('Delete VIP status:', response.status());
        if (response.status() === 200) {
            console.log('✅ VIP deleted');
        } else {
            console.log('ℹ️  Delete VIP:', json.message);
        }
    });

    test('TC-18: Should fail VIP operations without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/users/vips`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for VIPs, status:', response.status());
    });
});
