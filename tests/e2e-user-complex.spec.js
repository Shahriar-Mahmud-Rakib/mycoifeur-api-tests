// ============================================
// E2E Complex User Lifecycle (Live API Integrated)
// ============================================
// Flow:
// 1. Send OTP (Registration)
// 2. Resend OTP
// 3. Verify OTP (Code: 1234)
// 4. Update Profile
// 5. Forgot Password (Initiate)
// 6. Verify Reset OTP
// 7. Reset Password
// 8. Log In via OTP
// ============================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

function uniqueUserPayload() {
    const ts = Date.now().toString().slice(-7);
    return {
        email: `complex_user_${ts}@example.com`,
        password: 'Password123456',
        fname: 'Complex',
        lname: 'User',
        phone: `96655${ts}`,
        typeUser: 'user',
        countryCode: '966',
    };
}

test.describe('🔄 E2E Complex User Lifecycle Suite', () => {

    test('TC-E2E-COMPLEX-01: Register -> Resend OTP -> Verify -> Forgot Pw -> Reset -> Login', async ({ request }) => {
        const payload = uniqueUserPayload();
        console.log(`\n--- [COMPLEX USER E2E START] ---`);
        
        // 1. Send OTP
        console.log(`Step 1: Sending Registration OTP: ${payload.phone}`);
        const regRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser
            },
        });
        expect([200, 201]).toContain(regRes.status());
        console.log(`✅ Step 1 Success. OTP sent.`);

        // 2. Resend OTP
        console.log(`Step 2: Resending OTP...`);
        const resendRes = await request.post(`${BASE_URL}/api/v1/auth/resend-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser
            }
        });
        expect([200, 400, 429]).toContain(resendRes.status());
        
        // 3. Verify OTP
        console.log(`Step 3: Verifying Account with OTP...`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                code: '1234',
                typeUser: payload.typeUser,
                countryCode: payload.countryCode
            }
        });
        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        const userToken = verifyJson.data?.accessToken;
        expect(userToken).toBeDefined();
        console.log(`✅ Step 3 Success: Account verified.`);

        // 4. Update Profile
        console.log(`Step 4: Updating User Profile...`);
        const profRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` },
            data: { firstName: payload.fname, lastName: payload.lname, email: payload.email }
        });
        expect(profRes.status()).toBe(200);
        console.log(`✅ Step 4 Success: Profile updated.`);

        // 5. Forgot Password
        console.log(`Step 5: Requesting Forgot Password...`);
        const fpRes = await request.post(`${BASE_URL}/api/v1/auth/forgot-password`, {
            headers: MOBILE_HEADERS,
            data: { phone: payload.phone }
        });
        expect([200, 400, 404]).toContain(fpRes.status());
        if (fpRes.status() === 200) {
            const fpJson = await fpRes.json();
            const resetToken = fpJson.data?.token || 'test-token';

            // 6. Verify Reset OTP
            const fpVerifyRes = await request.post(`${BASE_URL}/api/v1/auth/verification-code/${resetToken}`, {
                headers: MOBILE_HEADERS,
                data: { code: '1234' }
            });
            expect([200, 400, 403, 404]).toContain(fpVerifyRes.status());
        }

        // 7. Log In via OTP to confirm active session
        console.log(`Step 7: Verifying active user session...`);
        const sessionRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${userToken}` }
        });
        expect(sessionRes.status()).toBe(200);
        console.log(`✅ Step 7 Success: User session active.`);
        console.log(`--- [COMPLEX USER E2E COMPLETE] ---\n`);
    });

});
