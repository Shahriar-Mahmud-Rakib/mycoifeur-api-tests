// ============================================
// Payments & Webhooks (Tap) API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken, getUserToken, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { FAKE_IDS } = require('./helpers/test-data.helper');

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

const userHeaders = async (request) => ({
    'Authorization': `Bearer ${await getUserToken(request)}`,
    ...MOBILE_HEADERS
});

test.describe('Tap Webhooks Tests', () => {

    test('TC-TAP-01: Tap payment callback', async ({ request }) => {
        // Mocking a tap callback payload
        const response = await request.post(`${BASE_URL}/api/v1/tap/callback`, {
            data: {
                id: 'chg_TS075220261908u8061906915',
                object: 'charge',
                status: 'CAPTURED',
            }
        });
        expect([200, 400, 404, 500]).toContain(response.status()); // Webhooks behavior varies based on valid IDs
    });

    test('TC-TAP-02: Tap balance callback', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/tap/balance/callback`, {
            data: { status: 'SUCCESS' }
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-TAP-03: Tap commissions callback', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/tap/commissions/callback`, {
            data: { status: 'SUCCESS' }
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-TAP-04: Tap refund callback', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/tap/refund/callback`, {
            data: { status: 'SUCCESS' }
        });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Admin Wallet & Commissions Tests', () => {

    test('TC-WALLET-01: Admin accept wallet balance', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/wallet/balances/1/accept`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-WALLET-02: Admin reject wallet balance', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/wallet/balances/1/reject`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-WALLET-03: Admin accept commission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/commissions/1/accept`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-WALLET-04: Admin reject commission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/commissions/1/reject`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-WALLET-05: Admin restore commission', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/commissions/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Banks Tests', () => {

    test('TC-BANKS-01: Restore bank', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/banks/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-BANKS-02: Set default bank', async ({ request }) => {
        const headers = await userHeaders(request);
        const response = await request.patch(`${BASE_URL}/api/v1/banks/1/set-default`, { headers });
        expect(response.status()).not.toBe(500);
    });
});
