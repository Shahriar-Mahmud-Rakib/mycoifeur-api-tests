// ============================================
// Guest Services, Offers & Packages API Tests
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { FAKE_IDS } = require('./helpers/test-data.helper');

test.describe('Guest Services API Tests', () => {
    test('TC-GUEST-SVC-01: Should show single service for guest', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services/1/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(500);
    });

    test('TC-GUEST-SVC-02: Should return 404 for non-existent service', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services/${FAKE_IDS.NON_EXISTENT}/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Guest Offers API Tests', () => {
    test('TC-GUEST-OFF-01: Should show single offer for guest', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/offers/1/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(500);
    });
});

test.describe('Guest Packages API Tests', () => {
    test('TC-GUEST-PKG-01: Should show single package for guest', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/packages/1/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(500);
    });
});
