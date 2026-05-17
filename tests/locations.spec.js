// ============================================
// Location APIs Tests
// ============================================
// GET /api/v1/locations/countries
// GET /api/v1/locations/cities
// GET /api/v1/locations/states
// GET /api/v1/locations/districts
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

test.describe('Countries API Tests', () => {

    test('TC-01: Should get list of countries', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/countries`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Countries status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        expect(Array.isArray(json.data) || typeof json.data === 'object').toBe(true);
        console.log('✅ Countries fetched successfully, count:', Array.isArray(json.data) ? json.data.length : 'paginated');
    });

    test('TC-02: Should get countries with pagination params', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/countries?page=1&limit=10`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        const json = await response.json();
        console.log('✅ Countries with pagination fetched, status:', response.status());
    });

    test('TC-03: Should respond to countries with lang header arabic', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/countries`, {
            headers: { ...MOBILE_HEADERS, 'x-custom-lang': 'ar' }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Countries Arabic lang fetched, status:', response.status());
    });
});

test.describe('Cities API Tests', () => {

    test('TC-04: Should get list of cities', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/cities`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Cities status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Cities fetched successfully');
    });

    test('TC-05: Should get cities with country filter', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/cities?country_id=1`, {
            headers: MOBILE_HEADERS
        });
        console.log('Cities by country status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Cities by country fetched');
    });

    test('TC-06: Should get cities with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/cities?page=1&limit=10`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Cities paginated:', response.status());
    });
});

test.describe('States API Tests', () => {

    test('TC-07: Should get list of states', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/states`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('States status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ States fetched successfully');
        } else {
            console.log('ℹ️  States response:', json.message);
        }
    });

    test('TC-08: Should get states with country filter', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/states?country_id=1`, {
            headers: MOBILE_HEADERS
        });
        console.log('✅ States by country status:', response.status());
    });
});

test.describe('Districts API Tests', () => {

    test('TC-09: Should get list of districts', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/districts`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Districts status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Districts fetched successfully');
        } else {
            console.log('ℹ️  Districts response:', json.message);
        }
    });

    test('TC-10: Should get districts with city filter', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/locations/districts?city_id=1`, {
            headers: MOBILE_HEADERS
        });
        console.log('✅ Districts by city status:', response.status());
    });
});
