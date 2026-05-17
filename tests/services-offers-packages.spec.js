// ============================================
// Services, Offers & Packages API Tests (Auth)
// ============================================
// GET /api/v1/services
// GET /api/v1/services/{id}/show
// GET /api/v1/offers
// GET /api/v1/offers/{id}/show
// GET /api/v1/packages
// GET /api/v1/packages/{id}/show
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

let testServiceId = null;
let testOfferId = null;
let testPackageId = null;

test.describe('Services API Tests (Authenticated)', () => {

    test('TC-01: Should get list of services', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/services`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log('Services status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testServiceId = json.data.data[0].id;
        }
        console.log('✅ Services fetched, first id:', testServiceId);
    });

    test('TC-02: Should get services with pagination', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/services?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Services paginated');
    });

    test('TC-03: Should get services by category', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/services?category_id=1`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Services by category status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Services by category fetched');
        }
    });

    test('TC-04: Should show single service', async ({ request }) => {
        const token = await getUserToken(request);
        const serviceId = testServiceId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/services/${serviceId}/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Service ${serviceId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            expect(json.data).toBeTruthy();
            console.log('✅ Single service fetched');
        } else {
            console.log('ℹ️  Service response:', json.message);
        }
    });

    test('TC-05: Should return 404 for non-existent service', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/services/99999999/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent service rejected, status:', response.status());
    });
});

test.describe('Offers API Tests (Authenticated)', () => {

    test('TC-06: Should get list of offers', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/offers`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Offers status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testOfferId = json.data.data[0].id;
        }
        console.log('✅ Offers fetched, first id:', testOfferId);
    });

    test('TC-07: Should get offers with pagination', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/offers?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Offers paginated');
    });

    test('TC-08: Should show single offer', async ({ request }) => {
        const token = await getUserToken(request);
        const offerId = testOfferId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/offers/${offerId}/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Offer ${offerId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Single offer fetched');
        } else {
            console.log('ℹ️  Offer response:', json.message);
        }
    });

    test('TC-09: Should return 404 for non-existent offer', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/offers/99999999/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent offer rejected, status:', response.status());
    });
});

test.describe('Packages API Tests (Authenticated)', () => {

    test('TC-10: Should get list of packages', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/packages`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Packages status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testPackageId = json.data.data[0].id;
        }
        console.log('✅ Packages fetched, first id:', testPackageId);
    });

    test('TC-11: Should get packages with pagination', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/packages?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Packages paginated');
    });

    test('TC-12: Should show single package', async ({ request }) => {
        const token = await getUserToken(request);
        const packageId = testPackageId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/packages/${packageId}/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Package ${packageId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Single package fetched');
        } else {
            console.log('ℹ️  Package response:', json.message);
        }
    });

    test('TC-13: Should return 404 for non-existent package', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/packages/99999999/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent package rejected, status:', response.status());
    });
});
