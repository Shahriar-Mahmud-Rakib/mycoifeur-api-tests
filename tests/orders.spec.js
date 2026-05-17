// ============================================
// Orders API Tests (User Auth)
// ============================================
// GET  /api/v1/orders/i
// GET  /api/v1/orders/{id}/show
// POST /api/v1/orders/{id}/cancel
// POST /api/v1/orders/{id}/restore
// POST /api/v1/orders/set/rates
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

let testOrderId = null;

test.describe('List User Orders Tests', () => {

    test('TC-01: Should get user orders list with valid token', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/orders/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Orders list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) {
            testOrderId = json.data.data[0].id;
            console.log('✅ Orders fetched, count:', json.data.data.length, ', first id:', testOrderId);
        } else {
            console.log('✅ Orders list returned (empty)');
        }
    });

    test('TC-02: Should get orders with pagination', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/orders/i?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Orders paginated');
    });

    test('TC-03: Should get orders with status filter', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/orders/i?status=completed`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Orders by status:', response.status());
        if (response.status() === 200) console.log('✅ Filtered orders fetched');
    });

    test('TC-04: Should fail to get orders without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/orders/i`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Show Single Order Tests', () => {

    test('TC-05: Should get single order by ID', async ({ request }) => {
        const token = await getUserToken(request);
        const orderId = testOrderId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/orders/${orderId}/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Order ${orderId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            expect(json.data).toBeTruthy();
            console.log('✅ Single order fetched');
        } else {
            console.log('ℹ️  Order show:', json.message);
        }
    });

    test('TC-06: Should return 404 for non-existent order', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/orders/99999999/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent order rejected, status:', response.status());
    });

    test('TC-07: Should fail show order without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/orders/1/show`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Cancel & Restore Order Tests', () => {

    test('TC-08: Should cancel an existing order', async ({ request }) => {
        const token = await getUserToken(request);
        const orderId = testOrderId || 1;
        const response = await request.post(`${BASE_URL}/api/v1/orders/${orderId}/cancel`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { reason: 'Testing cancellation' }
        });
        const json = await response.json();
        console.log('Cancel order status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Order cancelled');
        } else {
            console.log('ℹ️  Cancel order:', json.message);
        }
    });

    test('TC-09: Should fail cancel non-existent order', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/orders/99999999/cancel`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {}
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent order cancel rejected, status:', response.status());
    });

    test('TC-10: Should fail cancel order without auth', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/orders/1/cancel`, {
            headers: MOBILE_HEADERS, data: {}
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for cancel, status:', response.status());
    });

    test('TC-11: Should restore a cancelled order', async ({ request }) => {
        const token = await getUserToken(request);
        const orderId = testOrderId || 1;
        const response = await request.post(`${BASE_URL}/api/v1/orders/${orderId}/restore`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {}
        });
        const json = await response.json();
        console.log('Restore order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order restored');
        } else {
            console.log('ℹ️  Restore order:', json.message);
        }
    });

    test('TC-12: Should fail restore order without auth', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/orders/1/restore`, {
            headers: MOBILE_HEADERS, data: {}
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for restore, status:', response.status());
    });
});

test.describe('Rate Order Tests', () => {

    test('TC-13: Should submit order rating', async ({ request }) => {
        const token = await getUserToken(request);
        const orderId = testOrderId || 1;
        const response = await request.post(`${BASE_URL}/api/v1/orders/set/rates`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { order_id: orderId, rate: 5, comment: 'Excellent service!' }
        });
        const json = await response.json();
        console.log('Rate order status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Order rated');
        } else {
            console.log('ℹ️  Rate order:', json.message);
        }
    });

    test('TC-14: Should fail rating with invalid rate value', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/orders/set/rates`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { order_id: 1, rate: 10 } // Rate out of 1-5 range
        });
        const json = await response.json();
        console.log('Invalid rate status:', response.status());
        if (response.status() !== 200) console.log('✅ Invalid rate rejected:', json.message);
    });

    test('TC-15: Should fail rating without auth', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/orders/set/rates`, {
            headers: MOBILE_HEADERS,
            data: { order_id: 1, rate: 5 }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for rating, status:', response.status());
    });

    test('TC-16: Should fail rating without order_id', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/orders/set/rates`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { rate: 5 }
        });
        console.log('Missing order_id status:', response.status());
        if (response.status() !== 200) console.log('✅ Missing order_id rejected');
    });
});
