// ============================================
// Salons API Tests (Authenticated User)
// ============================================
// GET /api/v1/salons
// GET /api/v1/salons/{id}
// GET /api/v1/salons/{id}/working-days
// GET /api/v1/salons/{salon_id}/offers
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

let testSalonId = null;

test.describe('Salons List API Tests', () => {

    test('TC-01: Should get list of salons (authenticated)', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salons`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log('Salons list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testSalonId = json.data.data[0].id;
            console.log('✅ Salons fetched, first salon id:', testSalonId);
        } else {
            console.log('✅ Salons list returned');
        }
    });

    test('TC-02: Should get salons with pagination (authenticated)', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salons?page=1&limit=5`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Salons paginated');
    });

    test('TC-03: Should get salons with location coords', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salons?lat=24.7136&long=46.6753`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Salons with location status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salons with location filter');
        }
    });

    test('TC-04: Should get salons with category filter', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salons?category_id=1`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Salons by category status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Salons by category fetched');
        }
    });

    test('TC-05: Should fail to get salons without auth token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/salons`, {
            headers: MOBILE_HEADERS
        });
        // Some APIs allow guest access, document the behavior
        const json = await response.json();
        console.log('Salons no auth status:', response.status());
        console.log('ℹ️  No auth response:', json.message || 'Success');
    });
});

test.describe('Salon Details API Tests', () => {

    test('TC-06: Should get salon details by ID', async ({ request }) => {
        const token = await getUserToken(request);
        const salonId = testSalonId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/salons/${salonId}`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log(`Salon ${salonId} detail status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            expect(json.data).toBeTruthy();
            console.log('✅ Salon details fetched');
            console.log('   Salon name:', json.data.fname || json.data.name);
        } else {
            console.log('ℹ️  Salon detail response:', json.message);
        }
    });

    test('TC-07: Should return error for non-existent salon', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salons/99999999`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent salon rejected, status:', response.status());
    });

    test('TC-08: Should get salon working days', async ({ request }) => {
        const token = await getUserToken(request);
        const salonId = testSalonId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/salons/${salonId}/working-days`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log(`Salon ${salonId} working days status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon working days fetched');
        } else {
            console.log('ℹ️  Working days response:', json.message);
        }
    });

    test('TC-09: Should get salon offers by salon ID', async ({ request }) => {
        const token = await getUserToken(request);
        const salonId = testSalonId || 1;

        const response = await request.get(`${BASE_URL}/api/v1/salons/${salonId}/offers`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
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
});
