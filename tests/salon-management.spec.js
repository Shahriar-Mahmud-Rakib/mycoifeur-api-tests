// ============================================
// Salon Management API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, salonLogin, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { FAKE_IDS } = require('./helpers/test-data.helper');

let salonToken = null;

async function getSalonToken(request) {
    if (salonToken) return salonToken;
    const data = await salonLogin(request);
    salonToken = data.accessToken;
    return salonToken;
}

const H = async (request) => ({
    'Authorization': `Bearer ${await getSalonToken(request)}`,
    ...MOBILE_HEADERS
});

test.describe('Salon Services Management', () => {
    test('TC-SALON-SVC-01: Edit service', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/services/1/edit`, {
            headers,
            data: { name: 'Updated Service Name' }
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-SALON-SVC-02: Delete service', async ({ request }) => {
        const headers = await H(request);
        const response = await request.delete(`${BASE_URL}/api/v1/salon/services/1/delete`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-SALON-SVC-03: Restore service', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/salon/services/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });

    test('TC-SALON-SVC-04: Restore web service', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/services/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Salon Offers Management', () => {
    test('TC-SALON-OFF-01: Edit offer', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/offers/1/edit`, {
            headers,
            data: { name: 'Updated Offer Name' }
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-SALON-OFF-02: Restore offer', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/offers/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Salon Packages Management', () => {
    test('TC-SALON-PKG-01: Edit package', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/packages/1/edit`, {
            headers,
            data: { name: 'Updated Package Name' }
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-SALON-PKG-02: Restore package', async ({ request }) => {
        const headers = await H(request);
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/packages/1/restore`, { headers });
        expect(response.status()).not.toBe(500);
    });
});
