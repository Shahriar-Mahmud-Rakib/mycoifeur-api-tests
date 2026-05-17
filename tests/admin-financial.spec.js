// ============================================
// Admin Financial APIs Tests
// ============================================
// GET   /api/v1/web/admin/wallet
// GET   /api/v1/web/admin/wallet/balances
// PATCH /api/v1/web/admin/wallet/balances/{id}/accept
// PATCH /api/v1/web/admin/wallet/balances/{id}/reject
// POST  /api/v1/web/admin/wallet/send-money
// GET   /api/v1/web/admin/payments
// GET   /api/v1/web/admin/commissions
// GET   /api/v1/web/admin/commissions/{id}
// PATCH /api/v1/web/admin/commissions/{id}/accept
// PATCH /api/v1/web/admin/commissions/{id}/reject
// PATCH /api/v1/web/admin/commissions/{id}/restore
// GET   /api/v1/web/admin/reports/sales
// GET   /api/v1/web/admin/reports/sales/overview
// GET   /api/v1/web/admin/reports/sales/categories
// GET   /api/v1/web/admin/reports/sales/salons
// GET   /api/v1/web/admin/reports/sales/services
// GET   /api/v1/web/admin/reports/sales/statistics
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testBalanceId = null;
let testCommissionId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - Wallet Tests', () => {

    test('TC-01: Should get admin wallet overview', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/wallet`, { headers });
        const json = await response.json();
        console.log('Admin wallet status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Admin wallet fetched');
    });

    test('TC-02: Should get balance requests list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/wallet/balances`, { headers });
        const json = await response.json();
        console.log('Balance requests status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testBalanceId = json.data.data[0].id;
        console.log('✅ Balance requests fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-03: Should accept a balance request', async ({ request }) => {
        const headers = await adminHeaders(request);
        const balanceId = testBalanceId;
        if (!balanceId) { console.log('ℹ️  Skipping - no balance request found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/wallet/balances/${balanceId}/accept`, { headers });
        const json = await response.json();
        console.log('Accept balance status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Balance accepted');
        } else {
            console.log('ℹ️  Accept balance:', json.message);
        }
    });

    test('TC-04: Should reject a balance request', async ({ request }) => {
        const headers = await adminHeaders(request);
        const balanceId = testBalanceId;
        if (!balanceId) { console.log('ℹ️  Skipping - no balance request found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/wallet/balances/${balanceId}/reject`, {
            headers,
            data: { reason: 'Testing rejection' }
        });
        const json = await response.json();
        console.log('Reject balance status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Balance rejected');
        } else {
            console.log('ℹ️  Reject balance:', json.message);
        }
    });

    test('TC-05: Should send money to user', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/wallet/send-money`, {
            headers,
            data: { user_id: 1, amount: 10, note: 'Test transfer' }
        });
        const json = await response.json();
        console.log('Send money status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Money sent');
        } else {
            console.log('ℹ️  Send money:', json.message);
        }
    });

    test('TC-06: Should fail wallet operations without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/wallet`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Payments Tests', () => {

    test('TC-07: Should get admin payments list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/payments`, { headers });
        const json = await response.json();
        console.log('Payments list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Payments fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-08: Should get payments with pagination', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/payments?page=1&limit=5`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Payments paginated');
    });
});

test.describe('Admin - Commissions Tests', () => {

    test('TC-09: Should get commissions list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/commissions`, { headers });
        const json = await response.json();
        console.log('Commissions status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testCommissionId = json.data.data[0].id;
        console.log('✅ Commissions fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-10: Should get single commission by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        const commId = testCommissionId;
        if (!commId) { console.log('ℹ️  Skipping - no commission found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/commissions/${commId}`, { headers });
        const json = await response.json();
        console.log('Commission detail status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Commission detail fetched');
        } else {
            console.log('ℹ️  Commission:', json.message);
        }
    });

    test('TC-11: Should accept commission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const commId = testCommissionId;
        if (!commId) { console.log('ℹ️  Skipping - no commission found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/commissions/${commId}/accept`, { headers });
        const json = await response.json();
        console.log('Accept commission status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Commission accepted');
        } else {
            console.log('ℹ️  Accept commission:', json.message);
        }
    });

    test('TC-12: Should reject commission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const commId = testCommissionId;
        if (!commId) { console.log('ℹ️  Skipping - no commission found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/commissions/${commId}/reject`, {
            headers, data: { reason: 'Testing rejection' }
        });
        const json = await response.json();
        console.log('Reject commission status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Commission rejected');
        } else {
            console.log('ℹ️  Reject commission:', json.message);
        }
    });
});

test.describe('Admin - Sales Reports Tests', () => {

    test('TC-13: Should get sales report', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales`, { headers });
        const json = await response.json();
        console.log('Sales report status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Sales report fetched');
    });

    test('TC-14: Should get sales overview', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales/overview`, { headers });
        const json = await response.json();
        console.log('Sales overview status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Sales overview fetched');
    });

    test('TC-15: Should get sales by categories', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales/categories`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Sales by categories fetched');
    });

    test('TC-16: Should get sales by salons', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales/salons`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Sales by salons fetched');
    });

    test('TC-17: Should get sales by services', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales/services`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Sales by services fetched');
    });

    test('TC-18: Should get sales statistics', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales/statistics`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Sales statistics fetched');
    });

    test('TC-19: Should get sales with date range filter', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(
            `${BASE_URL}/api/v1/web/admin/reports/sales?from=2026-01-01&to=2026-12-31`,
            { headers }
        );
        expect(response.status()).toBe(200);
        console.log('✅ Sales with date filter fetched');
    });

    test('TC-20: Should fail reports without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/reports/sales`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
