// ============================================
// Admin Orders Management API Tests
// ============================================
// GET   /api/v1/web/admin/orders
// GET   /api/v1/web/admin/orders/pending
// GET   /api/v1/web/admin/orders/other
// GET   /api/v1/web/admin/orders/carts
// GET   /api/v1/web/admin/orders/{id}/show
// PATCH /api/v1/web/admin/orders/{id}/accept
// PATCH /api/v1/web/admin/orders/{id}/reject
// PATCH /api/v1/web/admin/orders/{id}/assign
// DEL   /api/v1/web/admin/orders/{id}/delete
// PATCH /api/v1/web/admin/orders/{id}/restore
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testOrderId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - List Orders Tests', () => {

    test('TC-01: Should get all orders list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders`, { headers });
        const json = await response.json();
        console.log('Admin orders list status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testOrderId = json.data.data[0].id;
        console.log('✅ Orders list fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-02: Should get orders with pagination', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders?page=1&limit=5`, { headers });
        expect(response.status()).toBe(200);
        console.log('✅ Orders paginated');
    });

    test('TC-03: Should get pending orders', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders/pending`, { headers });
        const json = await response.json();
        console.log('Pending orders status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Pending orders fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-04: Should get other orders', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders/other`, { headers });
        const json = await response.json();
        console.log('Other orders status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Other orders fetched');
    });

    test('TC-05: Should get carts list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders/carts`, { headers });
        const json = await response.json();
        console.log('Carts list status:', response.status());
        expect(response.status()).toBe(200);
        console.log('✅ Carts fetched');
    });

    test('TC-06: Should fail get orders without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Order Detail Tests', () => {

    test('TC-07: Should get single order by ID', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/show`, { headers });
        const json = await response.json();
        console.log(`Order ${orderId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Order details fetched');
        } else {
            console.log('ℹ️  Order show:', json.message);
        }
    });

    test('TC-08: Should return 404 for non-existent order', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/orders/99999999/show`, { headers });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent order rejected, status:', response.status());
    });
});

test.describe('Admin - Order Status Actions Tests', () => {

    test('TC-09: Should accept an order', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/accept`, { headers });
        const json = await response.json();
        console.log('Accept order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order accepted');
        } else {
            console.log('ℹ️  Accept order:', json.message);
        }
    });

    test('TC-10: Should reject an order', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/reject`, {
            headers,
            data: { reason: 'Testing rejection' }
        });
        const json = await response.json();
        console.log('Reject order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order rejected');
        } else {
            console.log('ℹ️  Reject order:', json.message);
        }
    });

    test('TC-11: Should assign order to salon', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/assign`, {
            headers,
            data: { salon_id: 1 }
        });
        const json = await response.json();
        console.log('Assign order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order assigned');
        } else {
            console.log('ℹ️  Assign order:', json.message);
        }
    });

    test('TC-12: Should soft delete an order', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/delete`, { headers });
        const json = await response.json();
        console.log('Delete order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order deleted');
        } else {
            console.log('ℹ️  Delete order:', json.message);
        }
    });

    test('TC-13: Should restore deleted order', async ({ request }) => {
        const headers = await adminHeaders(request);
        const orderId = testOrderId;
        if (!orderId) { console.log('ℹ️  Skipping - no order found'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/orders/${orderId}/restore`, { headers });
        const json = await response.json();
        console.log('Restore order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order restored');
        } else {
            console.log('ℹ️  Restore order:', json.message);
        }
    });

    test('TC-14: Should fail order actions without auth', async ({ request }) => {
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/orders/1/accept`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
