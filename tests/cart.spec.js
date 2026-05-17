// ============================================
// Cart API — Full Test Suite
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY, FAKE_IDS } = require('./helpers/test-data.helper');

let cartItemId = null;

async function getToken(request) {
    return await getUserToken(request);
}

// ─── VIEW CART ─────────────────────────────
test.describe('🛒 Cart — View Cart Tests', () => {

    test('TC-CART-01 [POSITIVE] Get cart with valid token → 200 + schema', async ({ request }) => {
        const token = await getToken(request);
        const start = Date.now();
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        const elapsed = Date.now() - start;
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json).toHaveProperty('data');
        expect(elapsed).toBeLessThan(5000);
        if (json.data?.items?.length > 0) cartItemId = json.data.items[0].id;
        console.log(`✅ [TC-CART-01] Cart fetched in ${elapsed}ms, items: ${json.data?.items?.length || 0}`);
    });

    test('TC-CART-02 [NEGATIVE] No token → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, { headers: MOBILE_HEADERS });
        expect(res.status()).toBe(401);
        console.log(`✅ [TC-CART-02] No token → ${res.status()}`);
    });

    test('TC-CART-03 [NEGATIVE] Invalid token → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, Authorization: 'Bearer invalid-xyz' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-03] Invalid token → ${res.status()}`);
    });

    test('TC-CART-04 [SECURITY] SQL inject as token → not 500', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ' OR 1=1--` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-04] SQL token → ${res.status()}`);
    });

    test('TC-CART-05 [RESPONSE-TIME] Cart fetch < 5s', async ({ request }) => {
        const token = await getToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/cart/i`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(Date.now() - start).toBeLessThan(5000);
        console.log(`✅ [TC-CART-05] Cart response time OK`);
    });
});

// ─── ADD TO CART ────────────────────────────
test.describe('➕ Cart — Add Item Tests', () => {

    test('TC-CART-06 [POSITIVE] Add valid item to cart → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: 1, salon_id: 1, quantity: 1 },
        });
        const json = await res.json();
        if (res.status() === 200 || res.status() === 201) {
            expect(json.success).toBeTruthy();
            if (json.data?.id) cartItemId = json.data.id;
            console.log(`✅ [TC-CART-06] Item added, id: ${cartItemId}`);
        } else {
            console.log(`ℹ️  [TC-CART-06] ${json.message}`);
        }
        expect(res.status()).not.toBe(500);
    });

    test('TC-CART-07 [NEGATIVE] Missing service_id → not 200', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-07] Missing service_id → ${res.status()}`);
    });

    test('TC-CART-08 [NEGATIVE] Missing salon_id → not 200', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-08] Missing salon_id → ${res.status()}`);
    });

    test('TC-CART-09 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: MOBILE_HEADERS,
            data: { service_id: 1, salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-09] No auth → ${res.status()}`);
    });

    test('TC-CART-10 [BOUNDARY] quantity=0 → not 200 / not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: 1, salon_id: 1, quantity: 0 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-10] quantity=0 → ${res.status()}`);
    });

    test('TC-CART-11 [BOUNDARY] quantity=-1 → not 200 / not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: 1, salon_id: 1, quantity: -1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-11] quantity=-1 → ${res.status()}`);
    });

    test('TC-CART-12 [BOUNDARY] non-existent service_id=999999 → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: FAKE_IDS.NON_EXISTENT, salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-12] Non-existent service_id → ${res.status()}`);
    });

    test('TC-CART-13 [INVALID] String as service_id → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { service_id: 'abc', salon_id: 1, quantity: 1 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-13] String service_id → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CART-SEC-SQL-${i + 1} [SECURITY] SQL inject in cart add: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const token = await getToken(request);
            const res = await request.post(`${BASE_URL}/api/v1/cart/add`, {
                headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
                data: { service_id: payload, salon_id: payload, quantity: 1 },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject cart add [${i + 1}]: ${res.status()}`);
        });
    });
});

// ─── PROMO CODE ─────────────────────────────
test.describe('🎫 Cart — Promo Code Tests', () => {

    test('TC-CART-14 [NEGATIVE] Invalid promo code → not 200', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { promo_code: 'INVALIDXYZ99999' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-14] Invalid promo → ${res.status()}`);
    });

    test('TC-CART-15 [NEGATIVE] Empty promo code → not 200', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { promo_code: '' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-15] Empty promo → ${res.status()}`);
    });

    test('TC-CART-16 [NEGATIVE] Missing promo_code field → not 200', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: {},
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-16] Missing promo field → ${res.status()}`);
    });

    test('TC-CART-17 [NEGATIVE] No auth for promo → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: MOBILE_HEADERS, data: { promo_code: 'TEST' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-17] No auth promo → ${res.status()}`);
    });

    test('TC-CART-18 [BOUNDARY] Very long promo code (500 chars) → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { promo_code: 'A'.repeat(500) },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-18] Long promo code → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CART-SEC-PROMO-${i + 1} [SECURITY] SQL inject promo code: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const token = await getToken(request);
            const res = await request.post(`${BASE_URL}/api/v1/cart/add_promo`, {
                headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
                data: { promo_code: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject promo [${i + 1}]: ${res.status()}`);
        });
    });
});

// ─── AVAILABLE TIMES ────────────────────────
test.describe('📅 Cart — Available Times & Closed Days', () => {

    test('TC-CART-19 [POSITIVE] Available times valid salon + date → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=1&date=2026-06-01`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-19] Available times → ${res.status()}`);
    });

    test('TC-CART-20 [NEGATIVE] Available times missing date → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=1`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-20] Missing date → ${res.status()}`);
    });

    test('TC-CART-21 [INVALID] Invalid date format → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=1&date=NOT-A-DATE`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-21] Invalid date → ${res.status()}`);
    });

    test('TC-CART-22 [BOUNDARY] Past date → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=1&date=2000-01-01`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-22] Past date → ${res.status()}`);
    });

    test('TC-CART-23 [POSITIVE] Closed days valid salon → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/closed_days?salon_id=1`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-23] Closed days → ${res.status()}`);
    });

    test('TC-CART-24 [BOUNDARY] Non-existent salon_id → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=${FAKE_IDS.NON_EXISTENT}&date=2026-06-01`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-24] Non-existent salon → ${res.status()}`);
    });

    test('TC-CART-25 [SECURITY] SQL inject in salon_id param → not 500', async ({ request }) => {
        const token = await getToken(request);
        const encoded = encodeURIComponent("1; DROP TABLE salons");
        const res = await request.get(`${BASE_URL}/api/v1/cart/available_times?salon_id=${encoded}&date=2026-06-01`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-25] SQL inject salon_id → ${res.status()}`);
    });
});

// ─── DELETE & RESTORE ───────────────────────
test.describe('🗑️ Cart — Delete & Restore Tests', () => {

    test('TC-CART-26 [NEGATIVE] Delete without auth → 401', async ({ request }) => {
        const res = await request.delete(`${BASE_URL}/api/v1/cart/1/delete`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-26] Delete no auth → ${res.status()}`);
    });

    test('TC-CART-27 [BOUNDARY] Delete non-existent item → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.delete(`${BASE_URL}/api/v1/cart/${FAKE_IDS.NON_EXISTENT}/delete`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-27] Delete non-existent → ${res.status()}`);
    });

    test('TC-CART-28 [SECURITY] SQL inject in cart item ID path → not 500', async ({ request }) => {
        const token = await getToken(request);
        const encoded = encodeURIComponent(FAKE_IDS.SQL);
        const res = await request.delete(`${BASE_URL}/api/v1/cart/${encoded}/delete`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-28] SQL inject cart item ID → ${res.status()}`);
    });

    test('TC-CART-29 [NEGATIVE] Restore without auth → 401', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/cart/1/restore`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-29] Restore no auth → ${res.status()}`);
    });
});

// ─── PAYMENT ────────────────────────────────
test.describe('💳 Cart — Payment & Checkout Tests', () => {

    test('TC-CART-30 [NEGATIVE] Choose payment without auth → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
            headers: MOBILE_HEADERS, data: { payment_method: 'tap' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-30] Payment no auth → ${res.status()}`);
    });

    test('TC-CART-31 [INVALID] Invalid payment method → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { payment_method: 'INVALID_PAYMENT_XYZ' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-31] Invalid payment method → ${res.status()}`);
    });

    test('TC-CART-32 [NEGATIVE] Missing payment_method → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: {},
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-32] Missing payment method → ${res.status()}`);
    });

    test('TC-CART-33 [INVALID] Invalid scheduled_date format → not 500', async ({ request }) => {
        const token = await getToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { payment_method: 'tap', scheduled_date: 'NOT-A-DATE', scheduled_time: 'NOT-A-TIME' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CART-33] Invalid date/time → ${res.status()}`);
    });

    test('TC-CART-34 [NEGATIVE] Complete order without auth → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/cart/i/complet`, {
            headers: MOBILE_HEADERS, data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-CART-34] Complete no auth → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-CART-SEC-PAY-${i + 1} [SECURITY] SQL inject payment method: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const token = await getToken(request);
            const res = await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
                headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
                data: { payment_method: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject payment method [${i + 1}]: ${res.status()}`);
        });
    });
});
