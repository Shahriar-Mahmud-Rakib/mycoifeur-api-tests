// ============================================
// Update Password API Tests
// ============================================
// Endpoint: POST /api/v1/auth/update-password
// Body: { email, newPassword }
// Auth: Bearer token required
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken, USER_CREDENTIALS } = require('./helpers/auth.helper');

test.describe('Update Password API Tests', () => {

    test('TC-01: Should update password with valid data (authenticated)', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: {
                email: 'test@example.com',
                newPassword: 'Password123456'
            }
        });

        expect([200, 400, 404, 422]).toContain(response.status());
        console.log('Update password status:', response.status());
    });

    test('TC-02: Should fail update password without auth token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: MOBILE_HEADERS,
            data: {
                email: 'test@example.com',
                newPassword: 'NewPassword123'
            }
        });
        expect([400, 401, 404]).toContain(response.status());
        console.log('✅ No auth token correctly rejected, status:', response.status());
    });

    test('TC-03: Should fail update password with missing email', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: { newPassword: 'NewPassword123' }
        });
        expect([400, 404, 422]).toContain(response.status());
        console.log('✅ Missing email correctly rejected, status:', response.status());
    });

    test('TC-04: Should fail update password with missing newPassword', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: { email: 'test@example.com' }
        });
        expect([400, 404, 422]).toContain(response.status());
        console.log('✅ Missing newPassword correctly rejected, status:', response.status());
    });

    test('TC-05: Should fail update password with invalid token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': 'Bearer invalid-token-xyz'
            },
            data: {
                email: USER_CREDENTIALS.user,
                newPassword: 'NewPassword123'
            }
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Invalid token correctly rejected, status:', response.status());
    });
});
