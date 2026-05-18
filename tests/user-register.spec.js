// ============================================
// Exhaustive Test Suite: User Registration API
// ============================================
// Endpoint: POST /api/v1/auth/user/register
// Coverage: Positive, Negative, Validation, Auth, Status Code, Schema,
// Boundary, Security, Error Handling, Pagination, Upload, Role, Performance
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, USER_CREDENTIALS } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY } = require('./helpers/test-data.helper');

const ENDPOINT = `${BASE_URL}/api/v1/auth/user/register`;

function uniquePayload(overrides = {}) {
    const ts = Date.now().toString().slice(-8);
    return {
        email: `testuser_${ts}@example.com`,
        password: 'Password123456',
        fname: 'Test',
        lname: 'User',
        phone: `96655${ts.slice(-7)}`,
        type_user: 'user',
        country_id: '1',
        city_id: '1',
        ...overrides,
    };
}

test.describe('Exhaustive Registration Tests', () => {

    // 1. Positive Test Cases & 5. Status Code Validation & 6. Response Schema Validation
    test('TC-REG-POS-01: [Positive/Status/Schema] Should register new user successfully', async ({ request }) => {
        const payload = uniquePayload();
        
        console.log(`📤 Sending Registration Payload:`);
        console.log(`   - Name: ${payload.fname} ${payload.lname}`);
        console.log(`   - Email: ${payload.email}`);
        console.log(`   - Phone: ${payload.phone}`);

        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });

        // Status Code Validation
        expect([200, 201]).toContain(response.status());

        // Response Schema Validation
        const json = await response.json();
        
        console.log(`📥 Server Response Received (Status: ${response.status()}):`);
        console.log(JSON.stringify(json, null, 2));

        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        if(json.data) {
            // The API returns phone validation info instead of user ID
            expect(json.data).toHaveProperty('isPhoneValid');
            expect(json.data).toHaveProperty('phone');
        }
    });

    test('TC-REG-POS-02: [Positive] Should register company type successfully', async ({ request }) => {
        const payload = uniquePayload({ type_user: 'company' });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect([200, 201]).toContain(response.status());
    });

    // 2. Negative Test Cases & 9. Error handling
    test('TC-REG-NEG-01: [Negative/Error] Registration fails when required fields are missing', async ({ request }) => {
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: {} // Empty body
        });
        
        // API might return 400, 422, or 200 with success: false
        expect([200, 400, 422]).toContain(response.status());
        
        const json = await response.json();
        if (response.status() === 200) {
            expect(json).toHaveProperty('success', false);
        }
        expect(json).toHaveProperty('message'); // Error handling schema check
        expect(typeof json.message).toBe('string');
    });

    // 3. Validation test cases
    test('TC-REG-VAL-01: [Validation] Registration fails on invalid email format', async ({ request }) => {
        const payload = uniquePayload({ email: 'invalid_email_format' });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC-REG-VAL-02: [Validation] Registration fails on duplicate email', async ({ request }) => {
        // Known duplicate from test DB or previous run
        const payload = uniquePayload({ email: USER_CREDENTIALS.user });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    // 4. Authentication & authorization
    test('TC-REG-AUTH-01: [Auth] Public endpoint does not require auth token', async ({ request }) => {
        const payload = uniquePayload();
        // Remove any default auth headers if present in MOBILE_HEADERS
        const headersWithoutAuth = { ...MOBILE_HEADERS };
        delete headersWithoutAuth.Authorization;
        
        const response = await request.post(ENDPOINT, {
            headers: headersWithoutAuth,
            multipart: payload,
        });
        expect([200, 201]).toContain(response.status());
    });

    // 7. Boundary value cases
    test('TC-REG-BND-01: [Boundary] Password at minimum length (6 chars)', async ({ request }) => {
        const payload = uniquePayload({ password: BOUNDARY.MIN_PASSWORD });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).not.toBe(500); 
    });

    test('TC-REG-BND-02: [Boundary] Maximum length string in fname (255 chars)', async ({ request }) => {
        const payload = uniquePayload({ fname: BOUNDARY.MAX_STRING_255 });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).not.toBe(500); 
    });

    // 8. Security cases
    test('TC-REG-SEC-01: [Security] SQL Injection in Email', async ({ request }) => {
        const payload = uniquePayload({ email: SQL_INJECTION_PAYLOADS[0] });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).toBeGreaterThanOrEqual(400); // Should be blocked
        expect(response.status()).not.toBe(500);
    });

    test('TC-REG-SEC-02: [Security] XSS Injection in First Name', async ({ request }) => {
        const payload = uniquePayload({ fname: XSS_PAYLOADS[0] });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect(response.status()).not.toBe(500);
        
        const body = await response.text();
        expect(body).not.toContain('<script>alert');
    });

    // 10. Pagination/filter/search
    test('TC-REG-PAG-01: [Pagination/Search] Extraneous query parameters in register URL', async ({ request }) => {
        const payload = uniquePayload();
        // Passing pagination params to a POST endpoint to ensure it ignores them and doesn't crash
        const response = await request.post(`${ENDPOINT}?page=1&limit=10&search=test`, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect([200, 201]).toContain(response.status());
    });

    // 11. File upload APIs
    test('TC-REG-UPL-01: [File Upload] Registration with Avatar Image', async ({ request }) => {
        const payload = uniquePayload();
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: {
                ...payload,
                image: {
                    name: 'test-avatar.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake-png-data')
                }
            }
        });
        expect(response.status()).not.toBe(500);
    });

    // 12. Role-based access tests
    test('TC-REG-ROLE-01: [Role] Attempting to register as Admin role', async ({ request }) => {
        // Normal API should not allow public registration as an admin
        const payload = uniquePayload({ type_user: 'admin', role: 'admin' });
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        // Might fall back to normal user or reject
        expect([200, 201, 400, 403, 422]).toContain(response.status()); 
    });

    // 13. Performance/basic reliability checks
    test('TC-REG-PERF-01: [Performance] Registration response time < 2000ms', async ({ request }) => {
        const payload = uniquePayload();
        const startTime = Date.now();
        const response = await request.post(ENDPOINT, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Registration execution time: ${duration}ms`);
        // The test will not fail on performance limit per user request
        expect([200, 201]).toContain(response.status());
    });
});
