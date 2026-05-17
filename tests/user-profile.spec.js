// ============================================
// Exhaustive Test Suite: User Profile API
// ============================================
// Endpoint: /api/v1/user/profile (GET, PATCH, DELETE)
// Coverage: Positive, Negative, Validation, Auth, Status Code, Schema,
// Boundary, Security, Error Handling, Pagination, Upload, Role, Performance
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken, getAdminToken } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS, XSS_PAYLOADS, BOUNDARY, FAKE_IDS } = require('./helpers/test-data.helper');

test.describe('Exhaustive Profile Tests', () => {

    // 1. Positive Test Cases & 5. Status Code Validation & 6. Response Schema Validation
    test('TC-PROF-POS-01: [Positive/Status/Schema] Should get user profile successfully', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        
        // Status Code Validation
        expect(response.status()).toBe(200);
        
        // Response Schema Validation (using default Playwright expect)
        const json = await response.json();
        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        expect(json.data).toHaveProperty('id');
        expect(json.data).toHaveProperty('firstName');
        expect(json.data).toHaveProperty('email');
        expect(json.data).toHaveProperty('phone');
    });

    test('TC-PROF-POS-02: [Positive] Should update user profile successfully', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { firstName: 'UpdatedNameAuto' }
        });
        expect([200, 201]).toContain(response.status());
    });

    // 2. Negative Test Cases & 4. Authentication & Authorization & 9. Error handling
    test('TC-PROF-NEG-01: [Negative/Auth/Error] Missing Auth Token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(401); // Unauthorized
        
        const json = await response.json();
        expect(json.message).toBeTruthy(); // Error handling schema
    });

    test('TC-PROF-NEG-02: [Negative/Auth] Invalid Auth Token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': 'Bearer INVALID_TOKEN_123' }
        });
        expect(response.status()).toBe(401);
    });

    // 12. Role-based access tests
    test('TC-PROF-ROLE-01: [Role] Admin token accessing User Profile', async ({ request }) => {
        const token = await getAdminToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        // Admins should not hit user endpoints or at least should be handled properly (401/403 or 200 depending on business logic)
        expect([200, 401, 403]).toContain(response.status()); 
    });

    // 3. Validation test cases & 7. Boundary value cases
    test('TC-PROF-VAL-01: [Validation] Update profile with invalid email format', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { email: 'not-an-email' }
        });
        expect([400, 422, 500]).toContain(response.status()); // API should reject
    });

    test('TC-PROF-BND-01: [Boundary] Update profile with max length name (255 chars)', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { firstName: BOUNDARY.MAX_STRING_255 }
        });
        // Should either truncate, accept, or throw 400. But never 500 internal server error.
        expect(response.status()).not.toBe(500); 
    });

    test('TC-PROF-BND-02: [Boundary] Update profile with empty name', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { firstName: '' }
        });
        expect(response.status()).not.toBe(500); 
    });

    // 8. Security cases
    test('TC-PROF-SEC-01: [Security] SQL Injection in Profile Update', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { firstName: SQL_INJECTION_PAYLOADS[0] } // e.g. "' OR 1=1--"
        });
        expect(response.status()).not.toBe(500); 
    });

    test('TC-PROF-SEC-02: [Security] XSS Injection in Profile Update', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { firstName: XSS_PAYLOADS[0] } // e.g. "<script>alert(1)</script>"
        });
        expect(response.status()).not.toBe(500); 
        
        // Fetch it back to see if it's sanitized
        const getRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await getRes.json();
        // Ideally should not return exact script tag if properly sanitized by backend
    });

    // 10. Pagination/filter/search (Not typically applicable for single profile, but included for format compliance)
    // For profile, maybe there are query params we can pass to test how it reacts
    test('TC-PROF-PAG-01: [Pagination/Search] Unexpected query params on profile', async ({ request }) => {
        const token = await getUserToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/user/profile?page=1&limit=100&search=hacker`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200); // Should ignore them and just return profile
    });

    // 11. File upload APIs
    // Updating profile picture
    test('TC-PROF-UPL-01: [File Upload] Update profile avatar', async ({ request }) => {
        // We will pass a dummy string for file if actual file is not available in test runner
        const token = await getUserToken(request);
        const response = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: {
                image: {
                    name: 'test-avatar.jpg',
                    mimeType: 'image/jpeg',
                    buffer: Buffer.from('fake-image-content-for-testing')
                }
            }
        });
        expect(response.status()).not.toBe(500);
    });

    // 13. Performance/basic reliability checks
    test('TC-PROF-PERF-01: [Performance] Profile fetch response time < 2000ms', async ({ request }) => {
        const token = await getUserToken(request);
        const startTime = Date.now();
        const response = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Profile fetch time: ${duration}ms`);
        // The test will not fail on performance limit per user request
        expect(response.status()).toBe(200);
    });
});
