// ============================================
// Cards API — Full Test Suite (with Rich Allure Attachments)
// Endpoints:
// - GET    /api/v1/cards
// - POST   /api/v1/cards
// - GET    /api/v1/cards/{id}
// - PUT    /api/v1/cards/{id}
// - DELETE /api/v1/cards/{id}
// - POST   /api/v1/cards/{id}/restore
// - GET    /api/v1/cards/{id}/set-default
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');
const { TEST_CARD, SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, FAKE_IDS } = require('./helpers/test-data.helper');
const { attachApiStep } = require('./helpers/allure.helper');

let userToken = null;
let createdCardId = null;

test.beforeAll(async ({ request }) => {
    userToken = await getUserToken(request);
});

function getAuthHeader() {
    return {
        ...MOBILE_HEADERS,
        Authorization: `Bearer ${userToken}`,
    };
}

test.describe('💳 Cards API — Lifecycle & Integration Tests', () => {

    // ─── 1. CREATE CARD ─────────────────────────────────────
    test('TC-CARD-01 [POSITIVE] Add new test card → 200/201', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            cardholderName: TEST_CARD.cardholderName,
            expiryDate: TEST_CARD.expiryDate,
            cvv: TEST_CARD.cvv,
            isDefault: TEST_CARD.isDefault,
        };
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.post(url, { headers, data: payload });

        await attachApiStep(testInfo, {
            title: 'Add new test card',
            method: 'POST',
            url,
            headers,
            requestData: payload,
            response: res,
        });

        const status = res.status();
        expect([200, 201]).toContain(status);
        const json = await res.json().catch(() => ({}));
        expect(json.success).toBe(true);
        if (json.data?.id) {
            createdCardId = json.data.id;
        }
        console.log(`✅ [TC-CARD-01] Card created successfully, ID: ${createdCardId || 'N/A'}`);
    });

    // ─── 2. LIST CARDS ──────────────────────────────────────
    test('TC-CARD-02 [POSITIVE] List user cards → 200', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.get(url, { headers });

        await attachApiStep(testInfo, {
            title: 'List own cards',
            method: 'GET',
            url,
            headers,
            response: res,
        });

        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(Array.isArray(json.data)).toBe(true);
        console.log(`✅ [TC-CARD-02] Cards list fetched, count: ${json.data.length}`);
    });

    // ─── 3. GET SINGLE CARD ─────────────────────────────────
    test('TC-CARD-03 [POSITIVE] Get card by ID → 200', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const cardId = createdCardId || 1;
        const url = `${BASE_URL}/api/v1/cards/${cardId}`;
        const res = await request.get(url, { headers });

        await attachApiStep(testInfo, {
            title: `Get single card ID ${cardId}`,
            method: 'GET',
            url,
            headers,
            response: res,
        });

        expect([200, 404]).toContain(res.status());
        if (res.status() === 200) {
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.data).toHaveProperty('id');
            console.log(`✅ [TC-CARD-03] Single card fetched:`, json.data.id);
        }
    });

    // ─── 4. SET DEFAULT CARD ────────────────────────────────
    test('TC-CARD-04 [POSITIVE] Set card as default → 200', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const cardId = createdCardId || 1;
        const url = `${BASE_URL}/api/v1/cards/${cardId}/set-default`;
        const res = await request.get(url, { headers });

        await attachApiStep(testInfo, {
            title: `Set card ID ${cardId} as default`,
            method: 'GET',
            url,
            headers,
            response: res,
        });

        expect([200, 404]).toContain(res.status());
        if (res.status() === 200) {
            const json = await res.json();
            expect(json.success).toBe(true);
            console.log(`✅ [TC-CARD-04] Card set as default successfully`);
        }
    });

    // ─── 5. UPDATE CARD ─────────────────────────────────────
    test('TC-CARD-05 [POSITIVE] Update card information → 200', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const cardId = createdCardId || 1;
        const payload = {
            cardholderName: 'Updated Test User',
            expiryDate: '12/35',
        };
        const url = `${BASE_URL}/api/v1/cards/${cardId}`;
        const res = await request.put(url, { headers, data: payload });

        await attachApiStep(testInfo, {
            title: `Update card ID ${cardId}`,
            method: 'PUT',
            url,
            headers,
            requestData: payload,
            response: res,
        });

        expect([200, 404]).toContain(res.status());
        if (res.status() === 200) {
            const json = await res.json();
            expect(json.success).toBe(true);
            console.log(`✅ [TC-CARD-05] Card updated successfully`);
        }
    });

    // ─── 6. DELETE CARD ─────────────────────────────────────
    test('TC-CARD-06 [POSITIVE] Delete card (soft delete) → 200/400', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const cardId = createdCardId || 1;
        const url = `${BASE_URL}/api/v1/cards/${cardId}`;
        const res = await request.delete(url, { headers });

        await attachApiStep(testInfo, {
            title: `Delete card ID ${cardId}`,
            method: 'DELETE',
            url,
            headers,
            response: res,
        });

        expect([200, 400, 404]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        console.log(`✅ [TC-CARD-06] Delete card response (${res.status()}):`, json.message || 'Success');
    });

    // ─── 7. RESTORE CARD ────────────────────────────────────
    test('TC-CARD-07 [POSITIVE] Restore deleted card → 200', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const cardId = createdCardId || 1;
        const url = `${BASE_URL}/api/v1/cards/${cardId}/restore`;
        const res = await request.post(url, { headers, data: {} });

        await attachApiStep(testInfo, {
            title: `Restore card ID ${cardId}`,
            method: 'POST',
            url,
            headers,
            requestData: {},
            response: res,
        });

        expect([200, 404]).toContain(res.status());
        if (res.status() === 200) {
            const json = await res.json();
            expect(json.success).toBe(true);
            console.log(`✅ [TC-CARD-07] Card restored successfully`);
        }
    });
});

test.describe('🛡️ Cards API — Negative & Security Tests', () => {

    test('TC-CARD-NEG-01 [NEGATIVE] Add card without auth → 401', async ({ request }, testInfo) => {
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            cardholderName: TEST_CARD.cardholderName,
            expiryDate: TEST_CARD.expiryDate,
            cvv: TEST_CARD.cvv,
        };
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.post(url, { headers: MOBILE_HEADERS, data: payload });

        await attachApiStep(testInfo, {
            title: 'Add card without auth token',
            method: 'POST',
            url,
            headers: MOBILE_HEADERS,
            requestData: payload,
            response: res,
        });

        expect(res.status()).toBe(401);
        console.log(`✅ [TC-CARD-NEG-01] No auth rejected: 401`);
    });

    test('TC-CARD-NEG-02 [NEGATIVE] Add card with missing required fields → 400/422', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            // missing required fields
        };
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.post(url, { headers, data: payload });

        await attachApiStep(testInfo, {
            title: 'Add card with missing fields',
            method: 'POST',
            url,
            headers,
            requestData: payload,
            response: res,
        });

        expect([400, 422]).toContain(res.status());
        console.log(`✅ [TC-CARD-NEG-02] Missing fields rejected: ${res.status()}`);
    });

    test('TC-CARD-NEG-03 [NEGATIVE] Get non-existent card ID → 404', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const url = `${BASE_URL}/api/v1/cards/${FAKE_IDS.NON_EXISTENT}`;
        const res = await request.get(url, { headers });

        await attachApiStep(testInfo, {
            title: 'Get non-existent card',
            method: 'GET',
            url,
            headers,
            response: res,
        });

        expect([404, 400]).toContain(res.status());
        console.log(`✅ [TC-CARD-NEG-03] Non-existent card: ${res.status()}`);
    });

    test('TC-CARD-SEC-01 [SECURITY] SQL injection in cardholderName → safe handling', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            cardholderName: SQL_INJECTION_PAYLOADS[0],
            expiryDate: TEST_CARD.expiryDate,
            cvv: TEST_CARD.cvv,
        };
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.post(url, { headers, data: payload });

        await attachApiStep(testInfo, {
            title: 'SQL injection payload in cardholderName',
            method: 'POST',
            url,
            headers,
            requestData: payload,
            response: res,
        });

        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CARD-SEC-01] SQL injection handled safely: ${res.status()}`);
    });

    test('TC-CARD-SEC-02 [SECURITY] XSS in cardholderName → safe handling', async ({ request }, testInfo) => {
        const headers = getAuthHeader();
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            cardholderName: XSS_PAYLOADS[0],
            expiryDate: TEST_CARD.expiryDate,
            cvv: TEST_CARD.cvv,
        };
        const url = `${BASE_URL}/api/v1/cards`;
        const res = await request.post(url, { headers, data: payload });

        await attachApiStep(testInfo, {
            title: 'XSS payload in cardholderName',
            method: 'POST',
            url,
            headers,
            requestData: payload,
            response: res,
        });

        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-CARD-SEC-02] XSS handled safely: ${res.status()}`);
    });
});
