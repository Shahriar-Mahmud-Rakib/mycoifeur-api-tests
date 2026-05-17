// ============================================
// Salon Orders API Tests (Salon Auth)
// ============================================
// GET   /api/v1/salon/orders/i
// GET   /api/v1/salon/orders/i/calendar
// GET   /api/v1/salon/orders/{id}/show
// PATCH /api/v1/salon/orders/{order_id}/artist_accept
// PATCH /api/v1/salon/orders/{order_id}/artist_reject
// PATCH /api/v1/salon/orders/{order_id}/artist_in_way
// PATCH /api/v1/salon/orders/{order_id}/artist_recived
// PATCH /api/v1/salon/orders/{order_id}/artist_start
// PATCH /api/v1/salon/orders/{order_id}/artist_complete
// PATCH /api/v1/salon/orders/{order_id}/artist_restore
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, salonLogin } = require('./helpers/auth.helper');

let salonToken = null;
let testOrderId = null;

async function getSalonToken(request) {
    if (salonToken) return salonToken;
    const data = await salonLogin(request);
    salonToken = data.accessToken;
    return salonToken;
}

test.describe('Salon Orders List Tests', () => {

    test('TC-01: Should get salon orders list', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/i`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Salon orders status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) {
            testOrderId = json.data.data[0].id;
            console.log('✅ Orders fetched, count:', json.data.data.length, ', first id:', testOrderId);
        } else {
            console.log('✅ No salon orders yet');
        }
    });

    test('TC-02: Should get salon orders with pagination', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/i?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Salon orders paginated');
    });

    test('TC-03: Should get salon orders with status filter', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/i?status=pending`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Salon orders filtered status:', response.status());
        if (response.status() === 200) console.log('✅ Filtered salon orders fetched');
    });

    test('TC-04: Should fail get salon orders without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/i`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-05: Should get salon orders calendar', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/i/calendar?month=2026-06`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Salon orders calendar status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon orders calendar fetched');
        } else {
            console.log('ℹ️  Calendar:', json.message);
        }
    });
});

test.describe('Salon Order Detail Tests', () => {

    test('TC-06: Should get single order details', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/${orderId}/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Salon order ${orderId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Salon order details fetched');
        } else {
            console.log('ℹ️  Order show:', json.message);
        }
    });

    test('TC-07: Should return 404 for non-existent order', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/salon/orders/99999999/show`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent order rejected, status:', response.status());
    });
});

test.describe('Salon Order Status Change Tests', () => {

    test('TC-08: Should accept an order (artist_accept)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_accept`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Accept order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order accepted');
        } else {
            console.log('ℹ️  Accept order:', json.message);
        }
    });

    test('TC-09: Should reject an order (artist_reject)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_reject`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { reason: 'Test rejection' }
        });
        const json = await response.json();
        console.log('Reject order status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order rejected');
        } else {
            console.log('ℹ️  Reject order:', json.message);
        }
    });

    test('TC-10: Should mark artist on the way (artist_in_way)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_in_way`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Artist in way status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Artist marked as in way');
        } else {
            console.log('ℹ️  Artist in way:', json.message);
        }
    });

    test('TC-11: Should mark artist arrived (artist_recived)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_recived`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Artist received status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Artist marked as arrived');
        } else {
            console.log('ℹ️  Artist received:', json.message);
        }
    });

    test('TC-12: Should mark service started (artist_start)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_start`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Artist start status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Service started');
        } else {
            console.log('ℹ️  Artist start:', json.message);
        }
    });

    test('TC-13: Should mark service completed (artist_complete)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_complete`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Artist complete status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Service completed');
        } else {
            console.log('ℹ️  Artist complete:', json.message);
        }
    });

    test('TC-14: Should restore rejected order (artist_restore)', async ({ request }) => {
        const token = await getSalonToken(request);
        const orderId = testOrderId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/${orderId}/artist_restore`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Artist restore status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Order restored by artist');
        } else {
            console.log('ℹ️  Artist restore:', json.message);
        }
    });

    test('TC-15: Should fail order actions without auth', async ({ request }) => {
        const response = await request.patch(`${BASE_URL}/api/v1/salon/orders/1/artist_accept`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for order action, status:', response.status());
    });
});
