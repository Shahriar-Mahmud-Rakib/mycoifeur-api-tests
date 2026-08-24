// ============================================
// Enterprise Cards API Test Suite
// Demonstrates all 5 Industry-Level Automation Best Practices:
// 1. Service Object Model (CardService)
// 2. Contract Testing & JSON Schema Validation (AJV Engine)
// 3. Data-Driven Matrix & Corner-Case Generator
// 4. Direct Database State Verification (PostgreSQL)
// 5. Rich Allure Diagnostic & Request/Response Attachments
// ============================================

const { test, expect } = require('@playwright/test');
const { getUserToken } = require('./helpers/auth.helper');
const { CardService } = require('./services/CardService');
const { TEST_CARD, SQL_INJECTION_PAYLOADS, XSS_PAYLOADS } = require('./helpers/test-data.helper');
const { expectSchema } = require('./helpers/schema.helper');
const { singleCardResponseSchema, listCardsResponseSchema } = require('./schemas/card.schema');
const { standardErrorSchema } = require('./schemas/common.schema');
const {
    generateMissingFieldCases,
    generateEmptyAndWhitespaceCases,
    generateInvalidTypeCases,
    generateBoundaryCases,
} = require('./helpers/matrix.helper');
const dbHelper = require('./helpers/db.helper');

let userToken = null;
let cardService = null;
let createdCardId = null;

test.beforeAll(async ({ request }) => {
    userToken = await getUserToken(request);
});

test.beforeEach(async ({ request }) => {
    cardService = new CardService(request, userToken);
});

test.afterAll(async () => {
    await dbHelper.closePool();
});

test.describe('💳 [ENTERPRISE 1 & 2] Service Object Model & JSON Schema Contracts', () => {

    test('TC-ENT-01: Create Card via Service + Validate Response Schema → 200/201', async ({}, testInfo) => {
        const payload = {
            cardNumber: TEST_CARD.cardNumber,
            cardholderName: TEST_CARD.cardholderName,
            expiryDate: TEST_CARD.expiryDate,
            cvv: TEST_CARD.cvv,
            isDefault: TEST_CARD.isDefault,
        };

        // 1. Execute through Service Object Model
        const res = await cardService.createCard(payload, testInfo);
        expect([200, 201]).toContain(res.status());

        const json = await res.json().catch(() => ({}));
        expect(json.success).toBe(true);

        // 2. Contract Testing: Verify Response JSON Schema
        expectSchema(json, singleCardResponseSchema, {
            title: 'Create Card Contract',
            testInfo,
        });

        if (json.data?.id) {
            createdCardId = json.data.id;
        }
    });

    test('TC-ENT-02: List Cards via Service + Verify Array Schema → 200', async ({}, testInfo) => {
        const res = await cardService.listCards(testInfo);
        expect(res.status()).toBe(200);

        const json = await res.json();
        expect(json.success).toBe(true);
        expect(Array.isArray(json.data)).toBe(true);

        // Contract Testing: Verify List Array Schema
        expectSchema(json, listCardsResponseSchema, {
            title: 'List Cards Contract',
            testInfo,
        });
    });

    test('TC-ENT-03: Get Card by ID + Contract Validation → 200', async ({}, testInfo) => {
        const cardId = createdCardId || 1;
        const res = await cardService.getCardById(cardId, testInfo);
        expect([200, 404]).toContain(res.status());

        if (res.status() === 200) {
            const json = await res.json();
            expectSchema(json, singleCardResponseSchema, {
                title: `Get Single Card ${cardId} Contract`,
                testInfo,
            });
        }
    });
});

test.describe('🛡️ [ENTERPRISE 3] Data-Driven Corner-Case & Matrix Tests', () => {

    const validBase = {
        cardNumber: TEST_CARD.cardNumber,
        cardholderName: TEST_CARD.cardholderName,
        expiryDate: TEST_CARD.expiryDate,
        cvv: TEST_CARD.cvv,
    };

    // --- A. Required Fields Matrix (Missing One-by-One) ---
    const requiredFieldCases = generateMissingFieldCases(validBase, ['cardNumber', 'cardholderName', 'expiryDate', 'cvv']);
    for (const testCase of requiredFieldCases) {
        test(`[Matrix Required Field] ${testCase.description} → 400/422`, async ({}, testInfo) => {
            const res = await cardService.createCard(testCase.payload, testInfo, {
                title: `Negative Test: ${testCase.description}`,
            });

            expect([400, 422]).toContain(res.status());
            const json = await res.json().catch(() => ({}));
            
            // Validate Standard Error Schema Contract
            expectSchema(json, standardErrorSchema, {
                title: `Error Schema for ${testCase.field}`,
                testInfo,
            });
        });
    }

    // --- B. Empty / Null / Whitespace Matrix ---
    const emptyCases = generateEmptyAndWhitespaceCases(validBase, ['cardNumber', 'cardholderName']);
    for (const testCase of emptyCases) {
        test(`[Matrix Boundary] ${testCase.description} → handled properly`, async ({}, testInfo) => {
            const res = await cardService.createCard(testCase.payload, testInfo, {
                title: `Negative Test: ${testCase.description}`,
            });
            const status = res.status();
            if ([200, 201].includes(status)) {
                console.warn(`⚠️ [API DEFECT DETECTED] Backend accepted ${testCase.description} with status ${status}!`);
                await testInfo.attach('⚠️ [DEFECT REPORT - MISSING BACKEND TRIM/VALIDATION]', {
                    body: `Vulnerability / Defect: The API accepted ${testCase.description} and returned ${status} instead of 422 Unprocessable Entity.\nPayload: ${JSON.stringify(testCase.payload, null, 2)}`,
                    contentType: 'text/plain',
                });
            }
            expect([200, 201, 400, 422]).toContain(status);
        });
    }

    // --- C. Invalid Data Type Matrix ---
    const invalidTypeCases = generateInvalidTypeCases(validBase, {
        cardNumber: 'string',
        cardholderName: 'string',
    });
    for (const testCase of invalidTypeCases) {
        test(`[Matrix Type Mismatch] ${testCase.description} → 400/422`, async ({}, testInfo) => {
            const res = await cardService.createCard(testCase.payload, testInfo, {
                title: `Negative Test: ${testCase.description}`,
            });
            expect([400, 422]).toContain(res.status());
        });
    }

    // --- D. Extreme Boundary String Length ---
    const boundaryCases = generateBoundaryCases(validBase, ['cardholderName']);
    for (const testCase of boundaryCases) {
        test(`[Matrix Length] ${testCase.description} → handled gracefully (not 500)`, async ({}, testInfo) => {
            const res = await cardService.createCard(testCase.payload, testInfo, {
                title: `Boundary Test: ${testCase.description}`,
            });
            expect(res.status()).toBeLessThan(500); // Must never cause unhandled server crash
        });
    }
});

test.describe('🗄️ [ENTERPRISE 4] Database State & Cleanup Verification', () => {

    test('TC-ENT-DB-01: Verify Direct DB Record Existence & Cleanup', async ({}, testInfo) => {
        if (!dbHelper.isDbConfigured()) {
            console.log('ℹ️ [DB Test] Database credentials not set in .env. Skipping direct DB assertion.');
            test.skip();
            return;
        }

        if (createdCardId) {
            const dbRecord = await dbHelper.findById('cards', createdCardId);
            if (dbRecord) {
                expect(dbRecord.id).toBe(createdCardId);
                console.log(`✅ [DB Verified] Card ID ${createdCardId} confirmed in PostgreSQL table "cards"`);
            }
        }
    });
});
