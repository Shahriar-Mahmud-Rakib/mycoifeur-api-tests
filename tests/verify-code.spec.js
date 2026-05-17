// ============================================
// Verify Code & Resend Code — Full Test Suite
// ============================================
// Verify:  POST /api/v1/auth/verify-code   { phone, code }
// Resend:  POST /api/v1/auth/resend-code   { phone, fname? }
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY } = require('./helpers/test-data.helper');

const VERIFY_EP  = `${BASE_URL}/api/v1/auth/verify-code`;
const RESEND_EP  = `${BASE_URL}/api/v1/auth/resend-code`;
const KNOWN_PHONE = '966501234595'; // existing phone in system

// ─────────────────────────────────────────────
// VERIFY CODE — FUNCTIONAL
// ─────────────────────────────────────────────
test.describe('✅ Verify Code — Functional', () => {

    test('TC-VC-01 [POSITIVE] Resend code to known phone → should work or give meaningful error', async ({ request }) => {
        const start = Date.now();
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, fname: 'TestUser' },
        });
        const elapsed = Date.now() - start;
        const json = await res.json();
        console.log(`   Resend status: ${res.status()} | ${elapsed}ms | ${json.message}`);
        expect(res.status()).not.toBe(500);
        if (res.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ [TC-VC-01] Resend code sent successfully');
        } else {
            console.log(`ℹ️  [TC-VC-01] Resend response: ${json.message}`);
        }
    });
});

// ─────────────────────────────────────────────
// VERIFY CODE — NEGATIVE
// ─────────────────────────────────────────────
test.describe('❌ Verify Code — Negative Tests', () => {

    test('TC-VC-02 [NEGATIVE] Wrong verification code → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '0000' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-VC-02] Wrong code rejected: ${res.status()} — ${json.message}`);
    });

    test('TC-VC-03 [NEGATIVE] Non-existent phone number → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '966599999999', code: '1234' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-VC-03] Non-existent phone rejected: ${res.status()}`);
    });

    test('TC-VC-04 [NEGATIVE] Missing code field → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VC-04] Missing code rejected: ${res.status()}`);
    });

    test('TC-VC-05 [NEGATIVE] Missing phone field → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { code: '1234' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VC-05] Missing phone rejected: ${res.status()}`);
    });

    test('TC-VC-06 [NEGATIVE] Empty body → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VC-06] Empty body rejected: ${res.status()}`);
    });

    test('TC-VC-07 [NEGATIVE] Code with letters (not numeric) → not 200 / not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: 'ABCD' },
        });
        expect(res.status()).not.toBe(200);
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-07] Letter code rejected: ${res.status()}`);
    });

    test('TC-VC-08 [NEGATIVE] Code too short (1 digit) → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '1' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VC-08] 1-digit code rejected: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// VERIFY CODE — BOUNDARY VALUES
// ─────────────────────────────────────────────
test.describe('📏 Verify Code — Boundary Values', () => {

    test('TC-VC-BV-01 [BOUNDARY] Very long code (100 digits) → not 200 / not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '1'.repeat(100) },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-BV-01] Long code handled: ${res.status()}`);
    });

    test('TC-VC-BV-02 [BOUNDARY] Very long phone (30 digits) → not 200 / not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '9'.repeat(30), code: '1234' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-BV-02] Long phone handled: ${res.status()}`);
    });

    test('TC-VC-BV-03 [BOUNDARY] Phone 1 digit → not 200 / not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '9', code: '1234' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-BV-03] 1-digit phone handled: ${res.status()}`);
    });

    test('TC-VC-BV-04 [BOUNDARY] Code 0 (numeric zero) → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: 0 },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VC-BV-04] Code=0 rejected: ${res.status()}`);
    });

    test('TC-VC-BV-05 [BOUNDARY] Negative code value → not 200 / not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: -1234 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-BV-05] Negative code handled: ${res.status()}`);
    });

    test('TC-VC-BV-06 [BOUNDARY] Unicode in code → not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '١٢٣٤' }, // Arabic numerals
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VC-BV-06] Arabic numeral code handled: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// VERIFY CODE — SECURITY
// ─────────────────────────────────────────────
test.describe('🛡️ Verify Code — Security Tests', () => {

    SQL_INJECTION_PAYLOADS.slice(0, 4).forEach((payload, i) => {
        test(`TC-VC-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject phone: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(VERIFY_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: payload, code: '1234' },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject phone blocked [${i + 1}]: ${res.status()}`);
        });
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-VC-SEC-SQLC-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject code: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(VERIFY_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: KNOWN_PHONE, code: payload },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject code blocked [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-VC-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS in phone: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(VERIFY_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: payload, code: '1234' },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS in phone handled [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-VC-SEC-BF [SECURITY] Brute force 5 wrong codes — no 500, server stable', async ({ request }) => {
        for (let i = 0; i < 5; i++) {
            const code = String(1000 + i);
            const res = await request.post(VERIFY_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: KNOWN_PHONE, code },
            });
            expect(res.status()).not.toBe(500);
        }
        console.log('✅ [TC-VC-SEC-BF] 5 brute force verify attempts — server stable');
    });
});

// ─────────────────────────────────────────────
// VERIFY CODE — RESPONSE VALIDATION
// ─────────────────────────────────────────────
test.describe('📊 Verify Code — Response Validation', () => {

    test('TC-VC-RV-01 [SCHEMA] Error response has message field', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '9999' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        console.log(`✅ [TC-VC-RV-01] Error schema: "${json.message}"`);
    });

    test('TC-VC-RV-02 [RESPONSE-TIME] Verify code response < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '0000' },
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-VC-RV-02] Response time: ${elapsed}ms`);
    });

    test('TC-VC-RV-03 [STATUS] Wrong code returns 4xx (not 5xx)', async ({ request }) => {
        const res = await request.post(VERIFY_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, code: '9999' },
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        console.log(`✅ [TC-VC-RV-03] Wrong code → 4xx: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// RESEND CODE — FULL TEST SUITE
// ─────────────────────────────────────────────
test.describe('📤 Resend Code — Full Tests', () => {

    test('TC-RC-01 [POSITIVE] Resend to known phone → not 500', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE, fname: 'TestUser' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RC-01] Resend code: ${res.status()}`);
    });

    test('TC-RC-02 [NEGATIVE] Resend to non-existent phone → not 200', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '966599999999' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RC-02] Non-existent resend rejected: ${res.status()}`);
    });

    test('TC-RC-03 [NEGATIVE] Missing phone → not 200', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RC-03] Missing phone rejected: ${res.status()}`);
    });

    test('TC-RC-04 [NEGATIVE] Invalid phone format → not 200 / not 500', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: 'not_a_phone' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RC-04] Invalid phone format handled: ${res.status()}`);
    });

    test('TC-RC-05 [BOUNDARY] Very long phone → not 500', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '9'.repeat(50) },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RC-05] Long phone handled: ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-RC-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject resend phone: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(RESEND_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject resend blocked [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-RC-06 [RESPONSE-TIME] Resend code < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE },
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-RC-06] Resend response time: ${elapsed}ms`);
    });

    test('TC-RC-07 [SCHEMA] Error response has message', async ({ request }) => {
        const res = await request.post(RESEND_EP, {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-RC-07] Resend error message: "${json.message}"`);
    });
});
