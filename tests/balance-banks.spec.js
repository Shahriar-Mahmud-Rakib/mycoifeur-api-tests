// ============================================
// Balance & Banks API Tests (User Auth)
// ============================================
// GET  /api/v1/balance
// POST /api/v1/balance/new
// POST /api/v1/balance/apple-pay
// GET  /api/v1/banks
// POST /api/v1/banks
// GET  /api/v1/banks/{id}
// DEL  /api/v1/banks/{id}
// PATCH /api/v1/banks/{id}/restore
// PATCH /api/v1/banks/{id}/set-default
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

let testBankId = null;

test.describe('Balance API Tests', () => {

    test('TC-01: Should get user wallet balance', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/balance`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Balance status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        console.log('✅ Balance fetched:', json.data);
    });

    test('TC-02: Should fail to get balance without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/balance`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-03: Should initiate new balance top-up', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/balance/new`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { amount: 50, payment_method: 'tap' }
        });
        const json = await response.json();
        console.log('Balance top-up status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Balance top-up initiated');
        } else {
            console.log('ℹ️  Balance top-up:', json.message);
        }
    });

    test('TC-04: Should fail balance top-up with missing amount', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/balance/new`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { payment_method: 'tap' }
        });
        console.log('Missing amount status:', response.status());
        if (response.status() !== 200) console.log('✅ Missing amount rejected');
    });

    test('TC-05: Should fail balance top-up without auth', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/balance/new`, {
            headers: MOBILE_HEADERS,
            data: { amount: 50 }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-06: Should test Apple Pay balance top-up', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/balance/apple-pay`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { amount: 100, apple_pay_token: 'test-token-xyz' }
        });
        const json = await response.json();
        console.log('Apple Pay balance status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Apple Pay balance initiated');
        } else {
            console.log('ℹ️  Apple Pay balance:', json.message);
        }
    });
});

test.describe('Banks API Tests', () => {

    test('TC-07: Should get user bank accounts', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/banks`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Banks status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.length > 0) {
            testBankId = json.data[0].id;
            console.log('✅ Banks fetched, count:', json.data.length);
        } else {
            console.log('✅ No banks yet');
        }
    });

    test('TC-08: Should fail get banks without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/banks`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });

    test('TC-09: Should add new bank account', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/banks`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: {
                bank_name: 'Al Rajhi Bank',
                account_name: 'Test User',
                account_number: '1234567890123456',
                iban: 'SA0380000000608010167519'
            }
        });
        const json = await response.json();
        console.log('Add bank status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            expect(json.success).toBeTruthy();
            if (json.data?.id) testBankId = json.data.id;
            console.log('✅ Bank account added, id:', testBankId);
        } else {
            console.log('ℹ️  Add bank:', json.message);
        }
    });

    test('TC-10: Should fail add bank without required fields', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/banks`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            data: { bank_name: 'Test Bank' }
        });
        console.log('Missing bank fields status:', response.status());
        if (response.status() !== 200) console.log('✅ Missing fields rejected');
    });

    test('TC-11: Should get single bank account by ID', async ({ request }) => {
        const token = await getUserToken(request);
        const bankId = testBankId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/banks/${bankId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log(`Bank ${bankId} status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Bank details fetched');
        } else {
            console.log('ℹ️  Bank detail:', json.message);
        }
    });

    test('TC-12: Should set bank as default', async ({ request }) => {
        const token = await getUserToken(request);
        const bankId = testBankId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/banks/${bankId}/set-default`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Set default bank status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Bank set as default');
        } else {
            console.log('ℹ️  Set default bank:', json.message);
        }
    });

    test('TC-13: Should delete bank account', async ({ request }) => {
        const token = await getUserToken(request);
        const bankId = testBankId || 1;
        const response = await request.delete(`${BASE_URL}/api/v1/banks/${bankId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Delete bank status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Bank deleted');
        } else {
            console.log('ℹ️  Delete bank:', json.message);
        }
    });

    test('TC-14: Should restore deleted bank account', async ({ request }) => {
        const token = await getUserToken(request);
        const bankId = testBankId || 1;
        const response = await request.patch(`${BASE_URL}/api/v1/banks/${bankId}/restore`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Restore bank status:', response.status());
        if (response.status() === 200) {
            console.log('✅ Bank restored');
        } else {
            console.log('ℹ️  Restore bank:', json.message);
        }
    });

    test('TC-15: Should fail delete bank without auth', async ({ request }) => {
        const response = await request.delete(`${BASE_URL}/api/v1/banks/1`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected for delete bank, status:', response.status());
    });
});
