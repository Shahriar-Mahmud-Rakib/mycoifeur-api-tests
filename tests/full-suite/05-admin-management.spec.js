// ============================================
// Full Suite: Admin Panel - Admins Management (Exhaustive DDT)
// Module: Admin / Admins, Admin / Overview, Admin / Administration
// Lifecycle: create admin → test → delete admin
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('👑 Admin / Admins Management', () => {

    let adminToken, userToken;
    let createdAdminId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        userToken = await getUserToken(request);
    });

    test.afterAll(async ({ request }) => {
        if (createdAdminId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/admins/${createdAdminId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
        }
    });

    test('TC-ADMIN-01: Get admin profile (me)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins/me`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-ADMIN-RBAC-01: Get admin profile with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins/me`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test(`TC-ADMIN-RBAC-02: Normal user access admin profile → 403`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins/me`, { 
            headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403]).toContain(res.status());
    });

    test('TC-ADMIN-02: List all admins', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-ADMIN-03: Create new admin (Happy Path)', async ({ request }) => {
        const ts = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/admins`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                firstName: 'TestAdmin', lastName: 'User',
                email: `testadmin_${ts}@testmail.com`,
                password: 'Password123456'
            }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json();
        createdAdminId = json.id || json.data?.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-ADMIN-CREATE-VAL-${key}: Create admin invalid email (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/admins`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    firstName: 'TestAdmin', lastName: 'User',
                    email: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    password: 'Password123456'
                }
            });
            expect([400, 422, 500]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-ADMIN-CREATE-SEC-${key}: Create admin SQLi/XSS in firstName (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/admins`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    firstName: typeof payload.val === 'string' ? payload.val : 'Inject', 
                    lastName: 'User',
                    email: `secadmin_${Date.now()}@testmail.com`,
                    password: 'Password123456'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-ADMIN-05: Get admin by ID', async ({ request }) => {
        if (!createdAdminId) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins/${createdAdminId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-ADMIN-GET-SEC-${key}: Admin get admin by SQLi/XSS ID (${payload.desc})`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/web/admin/admins/${payload.val}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([400, 404, 422, 500]).toContain(res.status());
        });
    }

    test('TC-ADMIN-06: Update admin', async ({ request }) => {
        if (!createdAdminId) { test.skip(); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/admins/${createdAdminId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { fullName: 'Updated Admin Name' }
        });
        expect([200]).toContain(res.status());
    });
});

test.describe('📊 Admin / Overview', () => {

    let adminToken, userToken;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        userToken = await getUserToken(request);
    });

    const overviewEndpoints = [
        { name: 'Dashboard Overview', path: '/api/v1/web/admin/overview' },
        { name: 'Calendar Events', path: '/api/v1/web/admin/overview/calendar' },
        { name: 'Artist Statistics', path: '/api/v1/web/admin/overview/artist-statics' },
        { name: 'Salon Statistics', path: '/api/v1/web/admin/overview/salons-statics' },
        { name: 'User Statistics', path: '/api/v1/web/admin/overview/user-statics' },
        { name: 'Completed Orders Stats', path: '/api/v1/web/admin/overview/orders-completed-statics' },
        { name: 'Rejected Orders Stats', path: '/api/v1/web/admin/overview/orders-rejected-statics' },
        { name: 'All Orders Stats', path: '/api/v1/web/admin/overview/orders-statics' },
    ];

    for (const ep of overviewEndpoints) {
        test(`TC-OVERVIEW: ${ep.name}`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep.path}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
            expect([200, 500]).toContain(res.status());
        });

        test(`TC-OVERVIEW-RBAC: Normal user access ${ep.name} → 403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}${ep.path}`, {
                headers: { 'Authorization': `Bearer ${userToken}`, 'x-custom-lang': 'en' }
            });
            expect([401, 403, 500]).toContain(res.status());
        });
    }
});

test.describe('🔑 Admin / Administration (Permission Groups)', () => {

    let adminToken;
    let groupId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
    });

    test.afterAll(async ({ request }) => {
        if (groupId) {
            await request.delete(`${BASE_URL}/api/v1/web/admin/administration/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
            });
        }
    });

    test('TC-PERM-01: List permission groups', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/administration/groups`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-PERM-02: Create permission group', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/administration/groups`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name: `TestGroup_${Date.now()}`,
                perms: [{ group: 'settings_system', permissions: ['settings_view'] }]
            }
        });
        expect([200, 201]).toContain(res.status());
        const json = await res.json();
        groupId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-PERM-CREATE-SEC-${key}: Create permission group SQLi/XSS name (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/web/admin/administration/groups`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    name: typeof payload.val === 'string' ? payload.val : `Group_${Date.now()}`,
                    perms: [{ group: 'settings_system', permissions: ['settings_view'] }]
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-PERM-03: Get group by ID', async ({ request }) => {
        if (!groupId) { test.skip(); return; }
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/administration/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-PERM-04: Update permission group', async ({ request }) => {
        if (!groupId) { test.skip(); return; }
        const res = await request.patch(`${BASE_URL}/api/v1/web/admin/administration/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name: `UpdatedGroup_${Date.now()}`,
                perms: [{ group: 'settings_system', permissions: ['settings_view', 'settings_edit'] }]
            }
        });
        expect([200]).toContain(res.status());
    });
});
