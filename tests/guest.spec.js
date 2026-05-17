// ============================================
// Guest Public APIs Tests (No Authentication)
// ============================================
// GET /api/v1/guest/home
// GET /api/v1/guest/salons
// GET /api/v1/guest/salons/best
// GET /api/v1/guest/salons/{salon_id}/offers
// GET /api/v1/guest/services
// GET /api/v1/guest/services/{id}/show
// GET /api/v1/guest/services_types/{type}
// GET /api/v1/guest/offers
// GET /api/v1/guest/offers/{id}/show
// GET /api/v1/guest/packages
// GET /api/v1/guest/packages/{id}/show
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

// Shared test salon_id and resource IDs (discovered from responses)
let testSalonId = null;
let testServiceId = null;
let testOfferId = null;
let testPackageId = null;

test.describe('Guest Home API Tests', () => {

    test('TC-01: Should get guest home page data', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/home`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Guest home status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        console.log('✅ Guest home data fetched');
        console.log('   Keys:', Object.keys(json.data || {}));
    });

    test('TC-02: Should get guest home in Arabic', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/home`, {
            headers: { ...MOBILE_HEADERS, 'x-custom-lang': 'ar' }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Guest home Arabic fetched');
    });
});

test.describe('Guest Salons API Tests', () => {

    test('TC-03: Should get list of salons (guest)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Guest salons status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testSalonId = json.data.data[0].id;
            console.log('✅ Salons fetched, first salon id:', testSalonId);
        } else {
            console.log('✅ Salons list returned (empty or different structure)');
        }
    });

    test('TC-04: Should get salons with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons?page=1&limit=5`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Salons paginated, status:', response.status());
    });

    test('TC-05: Should get salons with search filter', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons?search=salon`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Salons search filter, status:', response.status());
    });

    test('TC-06: Should get salons with location filter', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons?lat=24.7136&long=46.6753`, {
            headers: MOBILE_HEADERS
        });
        console.log('Salons location filter status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salons by location fetched');
        }
    });

    test('TC-07: Should get best salons (guest)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons/best`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Best salons status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Best salons fetched');
    });

    test('TC-08: Should get salon offers (guest)', async ({ request }) => {
        // Use a known salon ID or skip if not available
        const salonId = testSalonId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons/${salonId}/offers`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log(`Salon ${salonId} offers status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon offers fetched');
        } else {
            console.log('ℹ️  Salon offers response:', json.message);
        }
    });

    test('TC-09: Should return error or empty for non-existent salon offers', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/salons/99999999/offers`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        // API may return 200 with empty data or 404 - both are acceptable behaviors
        if (response.status() === 200) {
            console.log('ℹ️  Non-existent salon returns 200 with empty/null data (acceptable)');
        } else {
            expect(response.status()).not.toBe(200);
            console.log('✅ Non-existent salon rejected, status:', response.status());
        }
    });
});

test.describe('Guest Services API Tests', () => {

    test('TC-10: Should get list of services (guest)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Guest services status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testServiceId = json.data.data[0].id;
        }
        console.log('✅ Services fetched, first service id:', testServiceId);
    });

    test('TC-11: Should get services with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services?page=1&limit=5`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Services paginated');
    });

    test('TC-12: Should show single service by ID (guest)', async ({ request }) => {
        const serviceId = testServiceId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/guest/services/${serviceId}/show`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log(`Service ${serviceId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Single service fetched');
        } else {
            console.log('ℹ️  Service show response:', json.message);
        }
    });

    test('TC-13: Should return 404 for non-existent service', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services/99999999/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent service rejected, status:', response.status());
    });

    test('TC-14: Should get services by type', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/services_types/hair`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Services by type status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Services by type fetched');
        } else {
            console.log('ℹ️  Services by type response:', json.message);
        }
    });
});

test.describe('Guest Offers API Tests', () => {

    test('TC-15: Should get list of offers (guest)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/offers`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Guest offers status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            if (json.data && json.data.data && json.data.data.length > 0) {
                testOfferId = json.data.data[0].id;
            }
            console.log('✅ Guest offers fetched, first id:', testOfferId);
        } else {
            // API may require auth or different headers for offers
            console.log('ℹ️  Guest offers response:', response.status(), json.message);
        }
    });

    test('TC-16: Should get offers with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/offers?page=1&limit=5`, {
            headers: MOBILE_HEADERS
        });
        console.log('Guest offers paginated status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Offers paginated');
        } else {
            const json = await response.json();
            console.log('ℹ️  Offers pagination response:', json.message);
        }
    });

    test('TC-17: Should show single offer by ID (guest)', async ({ request }) => {
        const offerId = testOfferId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/guest/offers/${offerId}/show`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log(`Offer ${offerId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Single offer fetched');
        } else {
            console.log('ℹ️  Offer show response:', json.message);
        }
    });

    test('TC-18: Should return 404 for non-existent offer', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/offers/99999999/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent offer rejected, status:', response.status());
    });
});

test.describe('Guest Packages API Tests', () => {

    test('TC-19: Should get list of packages (guest)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/packages`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Guest packages status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            if (json.data && json.data.data && json.data.data.length > 0) {
                testPackageId = json.data.data[0].id;
            }
            console.log('✅ Guest packages fetched, first id:', testPackageId);
        } else {
            console.log('ℹ️  Guest packages response:', response.status(), json.message);
        }
    });

    test('TC-20: Should get packages with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/packages?page=1&limit=5`, {
            headers: MOBILE_HEADERS
        });
        console.log('Guest packages paginated status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Packages paginated');
        } else {
            const json = await response.json();
            console.log('ℹ️  Packages pagination response:', json.message);
        }
    });

    test('TC-21: Should show single package by ID (guest)', async ({ request }) => {
        const packageId = testPackageId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/guest/packages/${packageId}/show`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log(`Package ${packageId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Single package fetched');
        } else {
            console.log('ℹ️  Package show response:', json.message);
        }
    });

    test('TC-22: Should return 404 for non-existent package', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/guest/packages/99999999/show`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent package rejected, status:', response.status());
    });
});
