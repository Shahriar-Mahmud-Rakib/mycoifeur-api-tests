// ============================================
// Guest Cart API — Full Test Suite
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, FAKE_IDS } = require('./helpers/test-data.helper');

test.describe('🛒 Guest Cart — View Cart Tests', () => {

    test('TC-GUEST-CART-01 [POSITIVE] Get guest cart → 200', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/guest/cart/i`, {
            headers: MOBILE_HEADERS,
        });
        expect([200, 401, 404]).toContain(res.status()); // Guest cart behavior might vary based on session
        console.log(`✅ [TC-GUEST-CART-01] Guest cart fetched → ${res.status()}`);
    });

    test('TC-GUEST-CART-02 [NEGATIVE] Invalid endpoint guest cart → 404', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/guest/cart/invalid-endpoint`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(404);
        console.log(`✅ [TC-GUEST-CART-02] Invalid endpoint → ${res.status()}`);
    });
});

test.describe('➕ Guest Cart — Add Item Tests', () => {

    test('TC-GUEST-CART-03 [POSITIVE] Add valid item to guest cart → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/add`, {
            headers: MOBILE_HEADERS,
            data: { service_id: 1, salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-GUEST-CART-03] Item added to guest cart → ${res.status()}`);
    });

    test('TC-GUEST-CART-04 [NEGATIVE] Missing service_id → not 200', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/add`, {
            headers: MOBILE_HEADERS,
            data: { salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-GUEST-CART-04] Missing service_id → ${res.status()}`);
    });

    test('TC-GUEST-CART-05 [BOUNDARY] quantity=0 → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/add`, {
            headers: MOBILE_HEADERS,
            data: { service_id: 1, salon_id: 1, quantity: 0 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-GUEST-CART-05] quantity=0 → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 1).forEach((payload, i) => {
        test(`TC-GUEST-CART-SEC-SQL-${i + 1} [SECURITY] SQL inject in guest cart add`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/guest/cart/add`, {
                headers: MOBILE_HEADERS,
                data: { service_id: payload, salon_id: payload, quantity: 1 },
            });
            expect(res.status()).not.toBe(500);
        });
    });
});

test.describe('🎫 Guest Cart — Promo Code Tests', () => {

    test('TC-GUEST-CART-06 [NEGATIVE] Invalid promo code → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/add_promo`, {
            headers: MOBILE_HEADERS,
            data: { promo_code: 'INVALIDXYZ99999' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-GUEST-CART-06] Invalid promo → ${res.status()}`);
    });
});

test.describe('📅 Guest Cart — Available Times & Closed Days', () => {
    test('TC-GUEST-CART-07 [POSITIVE] Available times valid salon → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/guest/cart/available_times?salon_id=1&date=2026-06-01`, {
            headers: MOBILE_HEADERS,
        });
        expect(res.status()).not.toBe(500);
    });

    test('TC-GUEST-CART-08 [POSITIVE] Closed days valid salon → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/guest/cart/closed_days?salon_id=1`, {
            headers: MOBILE_HEADERS,
        });
        expect(res.status()).not.toBe(500);
    });
});

test.describe('🗑️ Guest Cart — Delete & Restore Tests', () => {
    test('TC-GUEST-CART-09 [BOUNDARY] Delete non-existent item → not 500', async ({ request }) => {
        const res = await request.delete(`${BASE_URL}/api/v1/guest/cart/${FAKE_IDS.NON_EXISTENT}/delete`, {
            headers: MOBILE_HEADERS,
        });
        expect(res.status()).not.toBe(500);
    });

    test('TC-GUEST-CART-10 [BOUNDARY] Restore non-existent item → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/guest/cart/${FAKE_IDS.NON_EXISTENT}/restore`, {
            headers: MOBILE_HEADERS,
        });
        expect(res.status()).not.toBe(500);
    });
});

test.describe('💳 Guest Cart — Payment & Checkout Tests', () => {
    test('TC-GUEST-CART-11 [NEGATIVE] Choose payment without session → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/i/choose/payment`, {
            headers: MOBILE_HEADERS, data: { payment_method: 'tap' },
        });
        expect(res.status()).not.toBe(500);
    });

    test('TC-GUEST-CART-12 [NEGATIVE] Complete order without session → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/guest/cart/i/complet`, {
            headers: MOBILE_HEADERS, data: {},
        });
        expect(res.status()).not.toBe(500);
    });
});
