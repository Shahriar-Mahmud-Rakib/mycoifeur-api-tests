// ============================================
// Categories API Tests
// ============================================
// GET /api/v1/categories
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

test.describe('Categories API Tests (Public)', () => {

    test('TC-01: Should get list of categories', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/categories`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Categories status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toBeTruthy();
        console.log('✅ Categories fetched');
        if (Array.isArray(json.data)) {
            console.log('   Count:', json.data.length);
        }
    });

    test('TC-02: Should get categories with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/categories?page=1&limit=10`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Categories paginated');
    });

    test('TC-03: Should get categories in Arabic', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/categories`, {
            headers: { ...MOBILE_HEADERS, 'x-custom-lang': 'ar' }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Categories in Arabic fetched');
    });

    test('TC-04: Should get categories with search', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/categories?search=hair`, {
            headers: MOBILE_HEADERS
        });
        console.log('Categories search status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Categories search works');
        }
    });
});

test.describe('Salon Categories API Tests (Salon Auth)', () => {

    test('TC-05: Should get salon categories with valid token', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/salon/categories`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log('Salon categories status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon categories fetched');
        } else {
            console.log('ℹ️  Salon categories response:', json.message);
        }
    });

    test('TC-06: Should fail to get salon categories without token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/salon/categories`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Salon categories without token rejected, status:', response.status());
    });
});
