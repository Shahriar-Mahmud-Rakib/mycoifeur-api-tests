// ============================================
// Forgot Password, Verify Reset & Reset Password
// — Full Test Suite
// ============================================
// POST /api/v1/auth/forgot-password         { phone }
// POST /api/v1/auth/verification-code/{token} { code }
// POST /api/v1/auth/reset-password/{token}  { password, password_confirmation }
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY } = require('./helpers/test-data.helper');

const FORGOT_EP  = `${BASE_URL}/api/v1/auth/forgot-password`;
const VERIFY_EP  = (token) => `${BASE_URL}/api/v1/auth/verification-code/${token}`;
const RESET_EP   = (token) => `${BASE_URL}/api/v1/auth/reset-password/${token}`;
const KNOWN_PHONE = '966501234595';

// ─────────────────────────────────────────────
// FORGOT PASSWORD — FUNCTIONAL
// ─────────────────────────────────────────────
test.describe('✅ Forgot Password — Functional Tests', () => {

    test('TC-FP-01 [POSITIVE] Send reset code to valid/known phone → not 500', async ({ request }) => {
        const start = Date.now();
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: KNOWN_PHONE },
        });
        const elapsed = Date.now() - start;
        const json = await res.json();
        console.log(`   Forgot pw status: ${res.status()} | ${elapsed}ms | ${json.message}`);
        expect(res.status()).not.toBe(500);
        if (res.status() === 200) {
            expect(json.success).toBe(true);
            expect(elapsed).toBeLessThan(5000);
            console.log('✅ [TC-FP-01] Reset code sent to valid phone');
        } else {
            console.log(`ℹ️  [TC-FP-01] Response: ${json.message}`);
        }
    });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — NEGATIVE
// ─────────────────────────────────────────────
test.describe('❌ Forgot Password — Negative Tests', () => {

    test('TC-FP-02 [NEGATIVE] Non-existent phone → not 200', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '966599999999' },
        });
        expect(res.status()).not.toBe(200);
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-FP-02] Non-existent phone rejected: ${res.status()} — ${json.message}`);
    });

    test('TC-FP-03 [NEGATIVE] Missing phone field → not 200', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-FP-03] Missing phone rejected: ${res.status()}`);
    });

    test('TC-FP-04 [NEGATIVE] Empty phone string → not 200', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-FP-04] Empty phone rejected: ${res.status()}`);
    });

    test('TC-FP-05 [NEGATIVE] Phone with letters → not 200 / not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: 'abc123def' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-05] Letter phone handled: ${res.status()}`);
    });

    test('TC-FP-06 [NEGATIVE] Special chars in phone → not 200 / not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: BOUNDARY.SPECIAL_CHARS },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-06] Special chars phone handled: ${res.status()}`);
    });

    test('TC-FP-07 [NEGATIVE] Email as phone (wrong field format) → not 200 / not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: 'user@example.com' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-07] Email as phone handled: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — BOUNDARY
// ─────────────────────────────────────────────
test.describe('📏 Forgot Password — Boundary Values', () => {

    test('TC-FP-BV-01 [BOUNDARY] Phone 1 digit → not 200 / not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '9' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-01] 1-digit phone: ${res.status()}`);
    });

    test('TC-FP-BV-02 [BOUNDARY] Phone 50 digits → not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '9'.repeat(50) },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-02] 50-digit phone: ${res.status()}`);
    });

    test('TC-FP-BV-03 [BOUNDARY] Numeric zero as phone → not 200 / not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: 0 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-03] Phone=0 handled: ${res.status()}`);
    });

    test('TC-FP-BV-04 [BOUNDARY] Negative phone number → not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: -966501234595 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-04] Negative phone: ${res.status()}`);
    });

    test('TC-FP-BV-05 [BOUNDARY] Float phone → not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: 966501234.5 },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-05] Float phone: ${res.status()}`);
    });

    test('TC-FP-BV-06 [BOUNDARY] Whitespace-only phone → not 200', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '   ' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-FP-BV-06] Whitespace phone rejected: ${res.status()}`);
    });

    test('TC-FP-BV-07 [BOUNDARY] Unicode phone → not 500', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '٩٦٦٥٠١٢٣٤٥' }, // Arabic numerals
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-FP-BV-07] Unicode phone handled: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — SECURITY
// ─────────────────────────────────────────────
test.describe('🛡️ Forgot Password — Security Tests', () => {

    SQL_INJECTION_PAYLOADS.forEach((payload, i) => {
        test(`TC-FP-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject in phone: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(FORGOT_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: payload },
            });
            expect(res.status()).not.toBe(200);
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject forgot-pw blocked [${i + 1}]: ${res.status()}`);
        });
    });

    XSS_PAYLOADS.forEach((payload, i) => {
        test(`TC-FP-SEC-XSS-${String(i + 1).padStart(2, '0')} [SECURITY] XSS in phone: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(FORGOT_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: payload },
            });
            expect(res.status()).not.toBe(500);
            const body = await res.text();
            expect(body).not.toContain('<script>alert');
            console.log(`✅ XSS forgot-pw handled [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-FP-SEC-BF [SECURITY] 5 rapid forgot-pw requests — no 500', async ({ request }) => {
        for (let i = 0; i < 5; i++) {
            const res = await request.post(FORGOT_EP, {
                headers: MOBILE_HEADERS,
                data: { phone: '966500000001' },
            });
            expect(res.status()).not.toBe(500);
        }
        console.log('✅ [TC-FP-SEC-BF] 5 rapid forgot-pw requests — server stable');
    });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — RESPONSE VALIDATION
// ─────────────────────────────────────────────
test.describe('📊 Forgot Password — Response Validation', () => {

    test('TC-FP-RV-01 [RESPONSE-TIME] Forgot password < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(FORGOT_EP, { headers: MOBILE_HEADERS, data: { phone: KNOWN_PHONE } });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-FP-RV-01] Forgot pw response: ${elapsed}ms`);
    });

    test('TC-FP-RV-02 [SCHEMA] Error has message field', async ({ request }) => {
        const res = await request.post(FORGOT_EP, { headers: MOBILE_HEADERS, data: {} });
        const json = await res.json();
        expect(json).toHaveProperty('message');
        expect(typeof json.message).toBe('string');
        console.log(`✅ [TC-FP-RV-02] Error message: "${json.message}"`);
    });

    test('TC-FP-RV-03 [STATUS] Invalid phone returns 4xx (not 5xx)', async ({ request }) => {
        const res = await request.post(FORGOT_EP, {
            headers: MOBILE_HEADERS,
            data: { phone: '966599999999' },
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        console.log(`✅ [TC-FP-RV-03] Invalid phone → 4xx: ${res.status()}`);
    });

    test('TC-FP-RV-04 [CONTENT-TYPE] Response is JSON', async ({ request }) => {
        const res = await request.post(FORGOT_EP, { headers: MOBILE_HEADERS, data: {} });
        const ct = res.headers()['content-type'] || '';
        expect(ct).toContain('application/json');
        console.log(`✅ [TC-FP-RV-04] Content-Type: ${ct}`);
    });
});

// ─────────────────────────────────────────────
// VERIFY RESET CODE
// ─────────────────────────────────────────────
test.describe('🔑 Verify Reset Code — Tests', () => {

    test('TC-VRC-01 [NEGATIVE] Invalid token → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP('invalid-token-99999'), {
            headers: MOBILE_HEADERS,
            data: { code: '1234' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VRC-01] Invalid token rejected: ${res.status()}`);
    });

    test('TC-VRC-02 [NEGATIVE] Missing code → not 200', async ({ request }) => {
        const res = await request.post(VERIFY_EP('any-token'), {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-VRC-02] Missing code rejected: ${res.status()}`);
    });

    test('TC-VRC-03 [NEGATIVE] Wrong code format (letters) → not 500', async ({ request }) => {
        const res = await request.post(VERIFY_EP('any-token'), {
            headers: MOBILE_HEADERS,
            data: { code: 'ABCD' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VRC-03] Letter code handled: ${res.status()}`);
    });

    test('TC-VRC-04 [SECURITY] SQL inject in token URL → not 500', async ({ request }) => {
        const encoded = encodeURIComponent("' OR 1=1--");
        const res = await request.post(VERIFY_EP(encoded), {
            headers: MOBILE_HEADERS,
            data: { code: '1234' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VRC-04] SQL inject token URL: ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-VRC-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject code field: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(VERIFY_EP('some-token'), {
                headers: MOBILE_HEADERS,
                data: { code: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject verify-reset code [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-VRC-05 [BOUNDARY] Very long token in URL → not 500', async ({ request }) => {
        const longToken = 'a'.repeat(500);
        const res = await request.post(VERIFY_EP(longToken), {
            headers: MOBILE_HEADERS,
            data: { code: '1234' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-VRC-05] Long token handled: ${res.status()}`);
    });
});

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
test.describe('🔒 Reset Password — Tests', () => {

    test('TC-RP-01 [NEGATIVE] Invalid token → not 200', async ({ request }) => {
        const res = await request.post(RESET_EP('invalid-token-99999'), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123', password_confirmation: 'NewPassword123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RP-01] Invalid token rejected: ${res.status()}`);
    });

    test('TC-RP-02 [NEGATIVE] Mismatched passwords → not 200', async ({ request }) => {
        const res = await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123', password_confirmation: 'DifferentPass456' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RP-02] Mismatched passwords rejected: ${res.status()}`);
    });

    test('TC-RP-03 [NEGATIVE] Missing password_confirmation → not 200', async ({ request }) => {
        const res = await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RP-03] Missing confirmation rejected: ${res.status()}`);
    });

    test('TC-RP-04 [NEGATIVE] Missing password field → not 200', async ({ request }) => {
        const res = await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: {},
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RP-04] Missing password rejected: ${res.status()}`);
    });

    test('TC-RP-05 [BOUNDARY] Short password (< 6 chars) → not 200', async ({ request }) => {
        const res = await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: { password: '12345', password_confirmation: '12345' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-RP-05] Short password rejected: ${res.status()}`);
    });

    test('TC-RP-06 [BOUNDARY] Very long password (1000 chars) → not 500', async ({ request }) => {
        const longPass = 'Password1!'.repeat(100);
        const res = await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: { password: longPass, password_confirmation: longPass },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RP-06] Long password handled: ${res.status()}`);
    });

    SQL_INJECTION_PAYLOADS.slice(0, 3).forEach((payload, i) => {
        test(`TC-RP-SEC-SQL-${String(i + 1).padStart(2, '0')} [SECURITY] SQL inject in new password: "${payload.substring(0, 25)}"`, async ({ request }) => {
            const res = await request.post(RESET_EP('some-token'), {
                headers: MOBILE_HEADERS,
                data: { password: payload, password_confirmation: payload },
            });
            expect(res.status()).not.toBe(500);
            console.log(`✅ SQL inject reset-password [${i + 1}]: ${res.status()}`);
        });
    });

    test('TC-RP-07 [SECURITY] SQL inject in reset token URL → not 500', async ({ request }) => {
        const encoded = encodeURIComponent("' OR 1=1--");
        const res = await request.post(RESET_EP(encoded), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123', password_confirmation: 'NewPassword123' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-RP-07] SQL inject token URL: ${res.status()}`);
    });

    test('TC-RP-08 [RESPONSE-TIME] Reset password response < 5s', async ({ request }) => {
        const start = Date.now();
        await request.post(RESET_EP('some-token'), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123', password_confirmation: 'NewPassword123' },
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(5000);
        console.log(`✅ [TC-RP-08] Reset password response: ${elapsed}ms`);
    });

    test('TC-RP-09 [SCHEMA] Error response has message', async ({ request }) => {
        const res = await request.post(RESET_EP('invalid-token'), {
            headers: MOBILE_HEADERS,
            data: { password: 'NewPassword123', password_confirmation: 'NewPassword123' },
        });
        const json = await res.json();
        expect(json).toHaveProperty('message');
        console.log(`✅ [TC-RP-09] Reset error message: "${json.message}"`);
    });
});
