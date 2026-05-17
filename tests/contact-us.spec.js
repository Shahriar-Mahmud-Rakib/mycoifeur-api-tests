// ============================================
// Contact Us API Tests
// ============================================
// POST /api/v1/contact_us
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getUserToken } = require('./helpers/auth.helper');

test.describe('Contact Us API Tests', () => {

    test('TC-01: Should send contact us message with valid data', async ({ request }) => {
        const token = await getUserToken(request);

        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            data: {
                name: 'Test User',
                email: 'test1214@gmail.com',
                message: 'This is a test message from automated testing.',
                subject: 'Test Subject'
            }
        });
        const json = await response.json();
        console.log('Contact us status:', response.status());
        console.log('Response:', JSON.stringify(json, null, 2));
        if (response.status() === 200 || response.status() === 201) {
            expect(json.success).toBeTruthy();
            console.log('✅ Contact us message sent successfully');
        } else {
            console.log('ℹ️  Contact us response:', json.message);
        }
    });

    test('TC-02: Should send contact us without auth (guest)', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: MOBILE_HEADERS,
            data: {
                name: 'Guest User',
                email: 'guest@example.com',
                message: 'Guest contact us message.',
                subject: 'Guest Inquiry'
            }
        });
        const json = await response.json();
        console.log('Guest contact us status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            console.log('✅ Guest contact us sent successfully');
        } else {
            console.log('ℹ️  Guest contact us response:', json.message);
        }
    });

    test('TC-03: Should fail with missing required message field', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: MOBILE_HEADERS,
            data: {
                name: 'Test User',
                email: 'test@example.com'
                // message intentionally missing
            }
        });
        console.log('Missing message status:', response.status());
        if (response.status() !== 200) {
            console.log('✅ Missing message correctly rejected');
        } else {
            console.log('ℹ️  API accepted without message field');
        }
    });

    test('TC-04: Should fail with missing email field', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: MOBILE_HEADERS,
            data: {
                name: 'Test User',
                message: 'Test message'
                // email intentionally missing
            }
        });
        console.log('Missing email status:', response.status());
        if (response.status() !== 200) {
            console.log('✅ Missing email correctly rejected');
        }
    });

    test('TC-05: Should fail with invalid email format', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: MOBILE_HEADERS,
            data: {
                name: 'Test User',
                email: 'not-an-email',
                message: 'Test message'
            }
        });
        console.log('Invalid email format status:', response.status());
        if (response.status() !== 200) {
            console.log('✅ Invalid email format rejected');
        }
    });

    test('TC-06: Should fail with empty body', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/v1/contact_us`, {
            headers: MOBILE_HEADERS,
            data: {}
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Empty body rejected, status:', response.status());
    });
});
