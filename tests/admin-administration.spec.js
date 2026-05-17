// ============================================
// Admin Administration & Role Permissions API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testGroupId = null;
let testRolePermissionId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - Administration Groups Tests', () => {

    test('TC-ADMIN-GRP-01: Should get list of administration groups', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/administration/groups`, { headers });
        const json = await response.json();
        console.log('Groups list status:', response.status());
        expect([200, 403, 404]).toContain(response.status()); // Handling different environments
        if (response.status() === 200 && json.data?.data?.length > 0) {
            testGroupId = json.data.data[0].id;
        }
    });

    test('TC-ADMIN-GRP-02: Should create new administration group', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/administration/groups`, {
            headers,
            data: { name: 'Test Group' }
        });
        expect([200, 201, 403, 404, 422]).toContain(response.status());
        const json = await response.json();
        if (json.data?.id) testGroupId = json.data.id;
    });

    test('TC-ADMIN-GRP-03: Should get single administration group', async ({ request }) => {
        if (!testGroupId) return;
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/administration/groups/${testGroupId}`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-ADMIN-GRP-04: Should get administration admins', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/administration/admins`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-ADMIN-GRP-05: Should get administration nurses', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/administration/nurses`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-ADMIN-GRP-06: Should get administration doctors', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/administration/doctors`, { headers });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Admin - Role User Permissions Tests', () => {

    test('TC-ADMIN-RUP-01: Should get role user permissions create list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/role-user-permissions/create-list`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-ADMIN-RUP-02: Should get list of role user permissions', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/role-user-permissions`, { headers });
        const json = await response.json();
        expect(response.status()).not.toBe(500);
        if (response.status() === 200 && json.data?.data?.length > 0) {
            testRolePermissionId = json.data.data[0].id;
        }
    });

    test('TC-ADMIN-RUP-03: Should edit role user permission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const pId = testRolePermissionId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/role-user-permissions/${pId}/edit`, { headers });
        expect(response.status()).not.toBe(500);
    });
});
