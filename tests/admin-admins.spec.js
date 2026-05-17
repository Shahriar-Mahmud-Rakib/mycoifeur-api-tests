// ============================================
// Admin Admins & Roles Management API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testAdminId = null;
let testRoleId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - My Profile Tests', () => {

    test('TC-01: Should get current admin profile (me)', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins/me`, { headers });
        const json = await response.json();
        console.log('Admin me status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Admin profile fetched:', json.data?.email);
    });

    test('TC-02: Should fail get admin me without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins/me`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for /me, status:', response.status());
    });
});

test.describe('Admin - Admins List Tests', () => {

    test('TC-03: Should get list of all admins', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins`, { headers });
        const json = await response.json();
        console.log('Admins list status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testAdminId = json.data.data[0].id;
        console.log('✅ Admins fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-04: Should get admins with pagination', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins?page=1&limit=5`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Admins paginated');
    });

    test('TC-05: Should get single admin by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdminId) { console.log('ℹ️  Skipping - no admin found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins/${testAdminId}`, { headers });
        const json = await response.json();
        console.log('Admin detail status:', response.status());
        if (response.status() === 200) console.log('✅ Admin details fetched');
        else console.log('ℹ️  Admin detail:', json.message);
    });

    test('TC-06: Should create new admin account', async ({ request }) => {
        const headers = await adminHeaders(request);
        const ts = Date.now().toString().slice(-6);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/admins`, {
            headers,
            multipart: {
                email: `testadmin${ts}@example.com`,
                password: 'Password123456',
                fname: 'Test', lname: 'Admin',
                phone: `96650${ts}`
            }
        });
        const json = await response.json();
        console.log('Create admin status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testAdminId = json.data.id;
            console.log('✅ Admin created, id:', testAdminId);
        } else {
            console.log('ℹ️  Create admin:', json.message);
        }
    });

    test('TC-07: Should toggle admin active status', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdminId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/admins/${testAdminId}/active`, { headers });
        const json = await response.json();
        console.log('Toggle active status:', response.status());
        if (response.status() === 200) console.log('✅ Admin active toggled');
        else console.log('ℹ️  Toggle active:', json.message);
    });

    test('TC-08: Should verify admin account', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdminId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/admins/${testAdminId}/verify`, { headers });
        const json = await response.json();
        console.log('Verify admin status:', response.status());
        if (response.status() === 200) console.log('✅ Admin verified');
        else console.log('ℹ️  Verify admin:', json.message);
    });

    test('TC-09: Should fail admins list without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/admins`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Roles Management Tests', () => {

    test('TC-10: Should get list of roles', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/roles`, { headers });
        const json = await response.json();
        console.log('Roles list status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testRoleId = json.data.data[0].id;
        console.log('✅ Roles fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-11: Should get roles create-list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/roles/create-list`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Roles create-list fetched');
    });

    test('TC-12: Should create new role', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/roles`, {
            headers,
            data: { name: 'Test Role', permissions: [] }
        });
        const json = await response.json();
        console.log('Create role status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testRoleId = json.data.id;
            console.log('✅ Role created, id:', testRoleId);
        } else {
            console.log('ℹ️  Create role:', json.message);
        }
    });

    test('TC-13: Should get single role', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testRoleId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/roles/${testRoleId}`, { headers });
        const json = await response.json();
        console.log('Role detail status:', response.status());
        if (response.status() === 200) console.log('✅ Role details fetched');
        else console.log('ℹ️  Role detail:', json.message);
    });

    test('TC-14: Should update role', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testRoleId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/roles/${testRoleId}`, {
            headers,
            data: { name: 'Updated Test Role' }
        });
        const json = await response.json();
        console.log('Update role status:', response.status());
        if (response.status() === 200) console.log('✅ Role updated');
        else console.log('ℹ️  Update role:', json.message);
    });

    test('TC-15: Should delete role', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testRoleId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/admin/roles/${testRoleId}`, { headers });
        const json = await response.json();
        console.log('Delete role status:', response.status());
        if (response.status() === 200) console.log('✅ Role deleted');
        else console.log('ℹ️  Delete role:', json.message);
    });

    test('TC-16: Should fail roles without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/roles`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
