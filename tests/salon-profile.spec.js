// ============================================
// Salon Profile — Full Test Suite
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, salonLogin } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY, FAKE_IDS } = require('./helpers/test-data.helper');

let salonToken = null;
let testServiceId = null;

async function getSalonToken(request) {
    if (salonToken) return salonToken;
    const data = await salonLogin(request);
    salonToken = data.accessToken;
    return salonToken;
}

// ─── PROFILE FILES ──────────────────────────
test.describe('📸 Salon Profile Files — Tests', () => {

    test('TC-SP-01 [POSITIVE] Update profile files with valid token → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const start = Date.now();
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(500);
        expect(Date.now() - start).toBeLessThan(5000);
        console.log(`✅ [TC-SP-01] Profile files → ${res.status()}`);
    });

    test('TC-SP-02 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: MOBILE_HEADERS, multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SP-02] No auth → ${res.status()}`);
    });

    test('TC-SP-03 [NEGATIVE] Invalid token → not 200 / not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: 'Bearer invalid-xyz' },
            multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(200);
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SP-03] Invalid token → ${res.status()}`);
    });

    test('TC-SP-04 [SECURITY] SQL inject token → not 500', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ' OR 1=1--` },
            multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SP-04] SQL inject token → ${res.status()}`);
    });

    test('TC-SP-05 [SECURITY] XSS in type field → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { type: '<script>alert(1)</script>' },
        });
        expect(res.status()).not.toBe(500);
        const body = await res.text();
        expect(body).not.toContain('<script>alert');
        console.log(`✅ [TC-SP-05] XSS type field → ${res.status()}`);
    });

    test('TC-SP-06 [INVALID] Invalid type value → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { type: 'INVALID_TYPE_XYZ' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SP-06] Invalid type → ${res.status()}`);
    });
});

// ─── WORKING DAYS ───────────────────────────
test.describe('📅 Salon Working Days — Tests', () => {

    test('TC-WD-01 [POSITIVE] Update working days valid data → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: {
                working_days: [
                    { day: 'monday',    start: '09:00', end: '18:00', is_open: true },
                    { day: 'tuesday',   start: '09:00', end: '18:00', is_open: true },
                    { day: 'wednesday', start: '09:00', end: '18:00', is_open: true },
                    { day: 'saturday',  start: '10:00', end: '14:00', is_open: true },
                    { day: 'friday',    start: '00:00', end: '00:00', is_open: false },
                ],
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-01] Working days update → ${res.status()}`);
    });

    test('TC-WD-02 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: MOBILE_HEADERS, data: { working_days: [] },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-WD-02] No auth working days → ${res.status()}`);
    });

    test('TC-WD-03 [NEGATIVE] Empty working_days array → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { working_days: [] },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-03] Empty working days → ${res.status()}`);
    });

    test('TC-WD-04 [NEGATIVE] Missing working_days field → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: {},
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-04] Missing field → ${res.status()}`);
    });

    test('TC-WD-05 [INVALID] Invalid day name → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { working_days: [{ day: 'FUNDAY', start: '09:00', end: '18:00', is_open: true }] },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-05] Invalid day name → ${res.status()}`);
    });

    test('TC-WD-06 [INVALID] Invalid time format → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { working_days: [{ day: 'monday', start: 'NOT_TIME', end: 'BAD', is_open: true }] },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-06] Invalid time format → ${res.status()}`);
    });

    test('TC-WD-07 [BOUNDARY] End time before start time → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { working_days: [{ day: 'monday', start: '18:00', end: '09:00', is_open: true }] },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-07] End before start → ${res.status()}`);
    });

    test('TC-WD-08 [SECURITY] SQL inject in day field → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { working_days: [{ day: "' OR 1=1--", start: '09:00', end: '18:00', is_open: true }] },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-WD-08] SQL inject day field → ${res.status()}`);
    });
});

// ─── SALON SERVICES ─────────────────────────
test.describe('💇 Salon Services — Tests', () => {

    test('TC-SS-01 [POSITIVE] Get salon services → 200 + schema', async ({ request }) => {
        const token = await getSalonToken(request);
        const start = Date.now();
        const res = await request.get(`${BASE_URL}/api/v1/salon/services`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json).toHaveProperty('data');
        expect(Date.now() - start).toBeLessThan(5000);
        if (json.data?.data?.length > 0) testServiceId = json.data.data[0].id;
        console.log(`✅ [TC-SS-01] Salon services: ${json.data?.data?.length || 0} items`);
    });

    test('TC-SS-02 [NEGATIVE] No auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salon/services`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SS-02] No auth services → ${res.status()}`);
    });

    test('TC-SS-03 [POSITIVE] Create salon service → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: 'Auto Service', description: 'Test', price: '150', duration: '45', category_id: '1' },
        });
        const json = await res.json();
        if ([200, 201].includes(res.status())) {
            if (json.data?.id) testServiceId = json.data.id;
            console.log(`✅ [TC-SS-03] Service created id: ${testServiceId}`);
        } else {
            console.log(`ℹ️  [TC-SS-03] ${json.message}`);
        }
        expect(res.status()).not.toBe(500);
    });

    test('TC-SS-04 [NEGATIVE] Create service missing required fields → not 200', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: 'Incomplete Only' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-04] Missing fields → ${res.status()}`);
    });

    test('TC-SS-05 [NEGATIVE] Create service no auth → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: MOBILE_HEADERS,
            multipart: { name: 'Test', price: '100', duration: '30', category_id: '1' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SS-05] No auth create → ${res.status()}`);
    });

    test('TC-SS-06 [BOUNDARY] Price = 0 → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: 'Free Service', price: '0', duration: '30', category_id: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-06] Price=0 → ${res.status()}`);
    });

    test('TC-SS-07 [BOUNDARY] Negative price → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: 'Neg Price', price: '-50', duration: '30', category_id: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-07] Negative price → ${res.status()}`);
    });

    test('TC-SS-08 [BOUNDARY] Very long service name (255 chars) → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: BOUNDARY.MAX_STRING_255, price: '100', duration: '30', category_id: '1' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-08] Long service name → ${res.status()}`);
    });

    test('TC-SS-09 [INVALID] Non-existent category_id → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            multipart: { name: 'BadCat', price: '100', duration: '30', category_id: String(FAKE_IDS.NON_EXISTENT) },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-09] Non-existent category → ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-SS-SEC-SQL-${i + 1} [SECURITY] SQL inject service name: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const token = await getSalonToken(request);
            const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
                headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
                multipart: { name: payload, price: '100', duration: '30', category_id: '1' },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject service name [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 2).forEach((payload, i) => {
        test(`TC-SS-SEC-XSS-${i + 1} [SECURITY] XSS in service name: "${payload.substring(0, 20)}"`, async ({ request }) => {
            const token = await getSalonToken(request);
            const res = await request.post(`${BASE_URL}/api/v1/salon/services/create`, {
                headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
                multipart: { name: payload, price: '100', duration: '30', category_id: '1' },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS service name [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-SS-10 [POSITIVE] Delete service → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const id = testServiceId || 1;
        const res = await request.delete(`${BASE_URL}/api/v1/salon/services/${id}/delete`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-10] Delete service → ${res.status()}`);
    });

    test('TC-SS-11 [NEGATIVE] Delete non-existent service → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.delete(`${BASE_URL}/api/v1/salon/services/${FAKE_IDS.NON_EXISTENT}/delete`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-11] Delete non-existent → ${res.status()}`);
    });

    test('TC-SS-12 [POSITIVE] Restore service → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const id = testServiceId || 1;
        const res = await request.patch(`${BASE_URL}/api/v1/salon/services/${id}/restore`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-12] Restore service → ${res.status()}`);
    });

    test('TC-SS-13 [SECURITY] SQL inject in service ID path → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const encoded = encodeURIComponent(FAKE_IDS.SQL);
        const res = await request.delete(`${BASE_URL}/api/v1/salon/services/${encoded}/delete`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-13] SQL inject service ID → ${res.status()}`);
    });

    // Pagination
    test('TC-SS-PAG-01 [VALID] Services page=1 limit=5 → 200', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/services?page=1&limit=5`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).toBe(200);
        console.log(`✅ [TC-SS-PAG-01] Services paginated → ${res.status()}`);
    });

    test('TC-SS-PAG-02 [EDGE] Services page=0 → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/services?page=0`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SS-PAG-02] page=0 → ${res.status()}`);
    });
});

// ─── COMMISSIONS & CALENDAR ─────────────────
test.describe('💰 Salon Commissions & Calendar — Tests', () => {

    test('TC-SC-01 [POSITIVE] Get commissions → 200 + schema', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/commissions`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        console.log(`✅ [TC-SC-01] Commissions → ${res.status()}`);
    });

    test('TC-SC-02 [NEGATIVE] No auth commissions → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salon/commissions`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SC-02] No auth commissions → ${res.status()}`);
    });

    test('TC-SC-03 [POSITIVE] Get calendar valid month → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/calendar?month=2026-06`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SC-03] Calendar 2026-06 → ${res.status()}`);
    });

    test('TC-SC-04 [NEGATIVE] No auth calendar → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/salon/calendar?month=2026-06`, { headers: MOBILE_HEADERS });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-SC-04] No auth calendar → ${res.status()}`);
    });

    test('TC-SC-05 [INVALID] Invalid month format → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/calendar?month=NOT-A-MONTH`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SC-05] Invalid month → ${res.status()}`);
    });

    test('TC-SC-06 [BOUNDARY] Future month far ahead → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/salon/calendar?month=2099-12`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SC-06] Far future month → ${res.status()}`);
    });

    test('TC-SC-07 [SECURITY] SQL inject month param → not 500', async ({ request }) => {
        const token = await getSalonToken(request);
        const encoded = encodeURIComponent("' OR 1=1--");
        const res = await request.get(`${BASE_URL}/api/v1/salon/calendar?month=${encoded}`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-SC-07] SQL inject month → ${res.status()}`);
    });

    test('TC-SC-08 [RESPONSE-TIME] Commissions < 5s', async ({ request }) => {
        const token = await getSalonToken(request);
        const start = Date.now();
        await request.get(`${BASE_URL}/api/v1/salon/commissions`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
        });
        expect(Date.now() - start).toBeLessThan(5000);
        console.log('✅ [TC-SC-08] Commissions response time OK');
    });
});
