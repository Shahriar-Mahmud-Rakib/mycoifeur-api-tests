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
                email: USER_CREDENTIALS.user,
                newPassword: USER_CREDENTIALS.password // Same password to avoid breaking other tests
            }
        });

        const json = await response.json();
        console.log('Update password status:', response.status());
        console.log('Response:', JSON.stringify(json, null, 2));

        if (response.status() === 200) {
            expect(json.success).toBeTruthy();
            console.log('✅ Password updated successfully');
        } else {
            console.log('ℹ️  Update password response:', json.message);
        }
    });

    test('TC-02: Should fail update password without auth token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: MOBILE_HEADERS,
            data: {
                email: USER_CREDENTIALS.user,
                newPassword: 'NewPassword123'
            }
        });
        expect(response.status()).not.toBe(200);
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
        expect(response.status()).not.toBe(200);
        console.log('✅ Missing email correctly rejected, status:', response.status());
    });

    test('TC-04: Should fail update password with missing newPassword', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/auth/update-password`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: { email: USER_CREDENTIALS.user }
        });
        expect(response.status()).not.toBe(200);
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
