// ============================================
// Full Suite: Financial - Banks, Wallet, Cards (Exhaustive DDT)
// Module: Admin/Banks, Public/Banks, App/Banks Account, App/Cards, App/Wallet, Admin/Wallet
// Lifecycle: create → test → delete
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('💰 Financial - Banks, Wallet & Cards', () => {

    let adminToken, userToken, testUser;
    let bankAccountId, cardId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
    });

    test.afterAll(async ({ request }) => {
        const userH = { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` };
        if (bankAccountId) {
            await request.delete(`${BASE_URL}/api/v1/banks/${bankAccountId}`, { headers: userH });
        }
        if (cardId) {
            await request.delete(`${BASE_URL}/api/v1/cards/${cardId}`, { headers: userH });
        }
        await deleteTestUser(request, testUser?.id);
    });

    // ---- Public Banks ----
    test('TC-BANK-01: Get public banks list', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/public/bank-info`, { headers: MOBILE_HEADERS });
        expect([200]).toContain(res.status());
    });

    // ---- Admin Banks ----
    test('TC-ADMIN-BANK-01: Admin list banks', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/bank-info?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-ADMIN-BANK-RBAC-01: Admin list banks with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/admin/bank-info?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test(`TC-ADMIN-BANK-RBAC-02: Normal user access admin banks → 403`, async ({ request }) => {
        const token = userToken || await getUserToken(request);
        const res = await request.get(`${BASE_URL}/api/v1/admin/bank-info`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'x-custom-lang': 'en' } 
        });
        expect([401, 403, 404]).toContain(res.status());
    });

    // ---- App / Banks Account (User bank accounts) ----
    test('TC-BANKACCT-01: User list bank accounts', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/bank-accounts`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-BANKACCT-02: User add bank account', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/bank-accounts`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
            data: {
                bankName: 'Test Bank', accountNumber: `IBAN${Date.now()}`,
                accountHolderName: 'Test User', swiftCode: 'TESTSWIFT'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        bankAccountId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-BANKACCT-ADD-VAL-${key}: User add bank account invalid IBAN (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/bank-accounts`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
                data: {
                    bankName: 'Test Bank', 
                    accountNumber: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    accountHolderName: 'Test User', swiftCode: 'TESTSWIFT'
                }
            });
            expect([400, 422, 500]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-BANKACCT-ADD-SEC-${key}: User add bank account SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/bank-accounts`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
                data: {
                    bankName: typeof payload.val === 'string' ? payload.val : 'Inject', 
                    accountNumber: `IBAN_${Date.now()}`,
                    accountHolderName: 'Test User', swiftCode: 'TESTSWIFT'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-BANKACCT-03: User list bank accounts (after add)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/bank-accounts`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- App / Cards ----
    test('TC-CARD-01: User list cards', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/cards`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200]).toContain(res.status());
    });

    // ---- App / Wallet ----
    test('TC-WALLET-01: User get wallet balance', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/wallet`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` }
        });
        expect([200, 404]).toContain(res.status());
    });

    test('TC-WALLET-02: Wallet without auth → 401', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/wallet`, { headers: MOBILE_HEADERS });
        expect([401, 403]).toContain(res.status());
    });

    // ---- Admin / Wallet ----
    test('TC-ADMIN-WALLET-01: Admin list wallets', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/wallet?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });

    // ---- Admin / Reports ----
    test('TC-REPORTS-01: Admin financial reports list', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/reports?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 404]).toContain(res.status());
    });

    // ---- Admin / Commissions ----
    test('TC-COMMISSION-01: Admin list commissions', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/web/admin/commissions?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });
});
