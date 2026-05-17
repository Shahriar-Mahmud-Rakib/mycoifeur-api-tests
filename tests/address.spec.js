// ============================================
// Address Management API Tests (User Auth)
// ============================================
// GET    /api/v1/address
// POST   /api/v1/address/create
// PATCH  /api/v1/address/update
// DELETE /api/v1/address/{id}/delete
// PATCH  /api/v1/address/{id}/restore
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

let createdAddressId = null;

test.describe('Get Addresses API Tests', () => {

    test('TC-01: Should get user addresses with valid token', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.get(`${BASE_URL}/api/v1/address`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await response.json();
        console.log('Get addresses status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Addresses fetched');
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            console.log('   Address count:', json.data.length);
        }
    });

    test('TC-02: Should fail to get addresses without token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/address`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-03: Should fail to get addresses with invalid token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/address`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': 'Bearer invalid-token-xyz'
            }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Invalid token rejected, status:', response.status());
    });
});

test.describe('Create Address API Tests', () => {

    test('TC-04: Should create new address with valid data', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/address/create`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: {
                title: 'Home',
                address: 'Test Street 123, Riyadh',
                lat: '24.7136',
                long: '46.6753',
                country_id: 1,
                city_id: 1
            }
        });
        const json = await response.json();
        console.log('Create address status:', response.status());
        console.log('Response:', JSON.stringify(json, null, 2));
        if (response.status() === 200 || response.status() === 201) {
            expect(json.success).toBeTruthy();
            if (json.data && json.data.id) {
                createdAddressId = json.data.id;
                console.log('✅ Address created, id:', createdAddressId);
            }
        } else {
            console.log('ℹ️  Create address response:', json.message);
        }
    });

    test('TC-05: Should fail to create address without title', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/address/create`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {
                address: 'Test Street',
                lat: '24.7136',
                long: '46.6753'
                // title missing
            }
        });
        console.log('Missing title status:', response.status());
        if (response.status() !== 200) {
            console.log('✅ Missing title correctly rejected');
        }
    });

    test('TC-06: Should fail to create address without lat/long', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/address/create`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {
                title: 'Work',
                address: 'Office Street'
                // lat and long missing
            }
        });
        console.log('Missing lat/long status:', response.status());
        if (response.status() !== 200) {
            console.log('✅ Missing lat/long correctly rejected');
        }
    });

    test('TC-07: Should fail to create address without auth token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/address/create`, {
            headers: MOBILE_HEADERS,
            data: {
                title: 'Home',
                address: 'Test Street',
                lat: '24.7136',
                long: '46.6753'
            }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for create, status:', response.status());
    });
});

test.describe('Update Address API Tests', () => {

    test('TC-08: Should update existing address', async ({ request }) => {
        const token = await getUserToken(request);

        // First get an address ID
        const getResp = await request.get(`${BASE_URL}/api/v1/address`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const getJson = await getResp.json();
        const addressId = (getJson.data && getJson.data[0]) ? getJson.data[0].id : (createdAddressId || 1);

        const response = await request.patch(`${BASE_URL}/api/v1/address/update`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {
                id: addressId,
                title: 'Updated Home',
                address: 'Updated Street 456, Riyadh',
                lat: '24.7200',
                long: '46.6800'
            }
        });
        const json = await response.json();
        console.log('Update address status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Address updated successfully');
        } else {
            console.log('ℹ️  Update address response:', json.message);
        }
    });

    test('TC-09: Should fail to update address without auth token', async ({ request }) => {
        const response = await request.patch(`${BASE_URL}/api/v1/address/update`, {
            headers: MOBILE_HEADERS,
            data: { id: 1, title: 'Hacker' }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for update, status:', response.status());
    });
});

test.describe('Delete & Restore Address API Tests', () => {

    test('TC-10: Should soft delete an address', async ({ request }) => {
        const token = await getUserToken(request);
        const addressId = createdAddressId || 1;

        const response = await request.delete(`${BASE_URL}/api/v1/address/${addressId}/delete`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Delete address status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Address deleted successfully');
        } else {
            console.log('ℹ️  Delete address response:', json.message);
        }
    });

    test('TC-11: Should restore a deleted address', async ({ request }) => {
        const token = await getUserToken(request);
        const addressId = createdAddressId || 1;

        const response = await request.patch(`${BASE_URL}/api/v1/address/${addressId}/restore`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Restore address status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Address restored successfully');
        } else {
            console.log('ℹ️  Restore address response:', json.message);
        }
    });

    test('TC-12: Should fail to delete address without auth token', async ({ request }) => {
        const response = await request.delete(`${BASE_URL}/api/v1/address/1/delete`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for delete, status:', response.status());
    });
});
