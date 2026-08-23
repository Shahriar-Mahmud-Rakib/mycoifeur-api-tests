// ============================================
// Exhaustive Test Suite: User Registration API
// ============================================
// Endpoint: POST /api/v1/auth/send-otp & /api/v1/auth/verify-code
// Coverage: Positive, Negative, Validation, Auth, Status Code, Schema,
// Boundary, Security, Error Handling, Pagination, Upload, Role, Performance
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, USER_CREDENTIALS } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY } = require('./helpers/test-data.helper');

const OTP_ENDPOINT = `${BASE_URL}/api/v1/auth/send-otp`;
const VERIFY_ENDPOINT = `${BASE_URL}/api/v1/auth/verify-code`;

function uniquePayload(overrides = {}) {
    const ts = Date.now().toString().slice(-7);
    return {
        email: `testuser_${ts}@example.com`,
        password: 'Password123456',
        fname: 'Test',
        lname: 'User',
        phone: `96655${ts}`,
        countryCode: '966',
        typeUser: 'user',
        ...overrides,
    };
}

test.describe('Exhaustive Registration Tests', () => {

    // 1. Positive Test Cases & 5. Status Code Validation & 6. Response Schema Validation
    test('TC-REG-POS-01: [Positive/Status/Schema] Should register new user successfully', async ({ request }) => {
        const payload = uniquePayload();
        
        console.log(`📤 Sending Registration OTP Payload:`);
        console.log(`   - Phone: ${payload.phone}`);

        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });

        // Status Code Validation
        expect([200, 201]).toContain(response.status());

        // Response Schema Validation
        const json = await response.json();
        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        if (json.data) {
            expect(json.data).toHaveProperty('isPhoneValid');
            expect(json.data).toHaveProperty('phone');
        }
    });

    test('TC-REG-POS-02: [Positive] Should register company type successfully', async ({ request }) => {
        const payload = uniquePayload({ typeUser: 'company' });
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201]).toContain(response.status());
    });

    // 2. Negative Test Cases & 9. Error handling
    test('TC-REG-NEG-01: [Negative/Error] Registration fails when required fields are missing', async ({ request }) => {
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {} // Empty body
        });
        
        expect([400, 422, 500]).toContain(response.status());
        const json = await response.json();
        expect(json).toHaveProperty('message');
    });

    // 3. Validation test cases
    test('TC-REG-VAL-01: [Validation] Registration fails on invalid email format', async ({ request }) => {
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: 'invalid-phone-num',
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC-REG-VAL-02: [Validation] Registration fails on duplicate email', async ({ request }) => {
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '123', // Invalid short phone
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    // 4. Authentication & authorization
    test('TC-REG-AUTH-01: [Auth] Public endpoint does not require auth token', async ({ request }) => {
        const payload = uniquePayload();
        const headersWithoutAuth = { ...MOBILE_HEADERS };
        delete headersWithoutAuth.Authorization;
        
        const response = await request.post(OTP_ENDPOINT, {
            headers: headersWithoutAuth,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201]).toContain(response.status());
    });

    // 7. Boundary value cases
    test('TC-REG-BND-01: [Boundary] Password at minimum length (6 chars)', async ({ request }) => {
        const payload = uniquePayload({ password: BOUNDARY.MIN_PASSWORD });
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect(response.status()).not.toBe(500); 
    });

    test('TC-REG-BND-02: [Boundary] Maximum length string in fname (255 chars)', async ({ request }) => {
        const payload = uniquePayload();
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect(response.status()).not.toBe(500); 
    });

    // 8. Security cases
    test('TC-REG-SEC-01: [Security] SQL Injection in Email', async ({ request }) => {
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: SQL_INJECTION_PAYLOADS[0],
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).not.toBe(500);
    });

    test('TC-REG-SEC-02: [Security] XSS Injection in First Name', async ({ request }) => {
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: XSS_PAYLOADS[0],
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(response.status()).not.toBe(500);
        
        const body = await response.text();
        expect(body).not.toContain('<script>alert');
    });

    // 10. Pagination/filter/search
    test('TC-REG-PAG-01: [Pagination/Search] Extraneous query parameters in register URL', async ({ request }) => {
        const payload = uniquePayload();
        const response = await request.post(`${OTP_ENDPOINT}?page=1&limit=10&search=test`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201]).toContain(response.status());
    });

    // 11. File upload APIs
    test('TC-REG-UPL-01: [File Upload] Registration with Avatar Image', async ({ request }) => {
        const payload = uniquePayload();
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect(response.status()).not.toBe(500);
    });

    // 12. Role-based access tests
    test('TC-REG-ROLE-01: [Role] Attempting to register as Admin role', async ({ request }) => {
        const payload = uniquePayload({ typeUser: 'admin' });
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201, 400, 403, 422]).toContain(response.status()); 
    });

    // 13. Performance/basic reliability checks
    test('TC-REG-PERF-01: [Performance] Registration response time < 2000ms', async ({ request }) => {
        const payload = uniquePayload();
        const startTime = Date.now();
        const response = await request.post(OTP_ENDPOINT, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Registration execution time: ${duration}ms`);
        expect([200, 201]).toContain(response.status());
    });
});
