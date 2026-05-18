// ============================================
// E2E Complex User Lifecycle (DB-Integrated)
// ============================================
// Flow:
// 1. Register User
// 2. Resend OTP
// 3. Fetch New OTP from DB & Verify
// 4. Forgot Password (Initiate)
// 5. Fetch Reset OTP from DB
// 6. Verify Reset OTP
// 7. Reset Password
// 8. Log In with New Password
// ============================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { Client } = require('pg');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

const DB_CONFIG = {
    host: process.env.DB_HOST || '52.220.54.42',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'mycoifeur_dev_db',
    user: process.env.DB_USER || 'mycoifeur_dev_user',
    password: process.env.DB_PASSWORD || 'gY2TDhhC3vBCeNN7SZQc',
};

async function getOtpFromDb(phone) {
    console.log(`🔌 Fetching DB OTP for phone: ${phone}...`);
    const client = new Client(DB_CONFIG);
    await client.connect();
    try {
        const res = await client.query(
            'SELECT reset_code FROM users WHERE phone = $1 ORDER BY id DESC LIMIT 1',
            [phone]
        );
        return res.rows[0]?.reset_code || null;
    } finally {
        await client.end();
    }
}

function uniqueUserPayload() {
    const ts = Date.now().toString().slice(-8);
    return {
        email: `complex_user_${ts}@example.com`,
        password: 'Password123456',
        fname: 'Complex',
        lname: 'User',
        phone: `96655${ts.slice(-7)}`,
        type_user: 'user',
        country_id: '1',
        city_id: '1',
    };
}

test.describe('🔄 E2E Complex User Lifecycle Suite', () => {

    test('TC-E2E-COMPLEX-01: Register -> Resend OTP -> Verify -> Forgot Pw -> Reset -> Login', async ({ request }) => {
        const payload = uniqueUserPayload();
        console.log(`\n--- [COMPLEX USER E2E START] ---`);
        
        // 1. Register
        console.log(`Step 1: Registering User: ${payload.phone}`);
        const regRes = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect([200, 201]).toContain(regRes.status());
        const initialOtp = await getOtpFromDb(payload.phone);
        console.log(`✅ Step 1 Success. Initial OTP: ${initialOtp}`);

        // 2. Resend OTP
        console.log(`Step 2: Resending OTP...`);
        const resendRes = await request.post(`${BASE_URL}/api/v1/auth/resend-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: payload.phone }
        });
        expect(resendRes.status()).toBe(200);
        
        // 3. Fetch New OTP & Verify
        // Wait briefly for DB update
        await new Promise(r => setTimeout(r, 1000));
        const newOtp = await getOtpFromDb(payload.phone);
        console.log(`✅ Step 2/3 Success: OTP Resent! New OTP: ${newOtp}`);
        
        console.log(`Step 3: Verifying Account with Resent OTP...`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: payload.phone, code: newOtp }
        });
        expect(verifyRes.status()).toBe(200);
        console.log(`✅ Step 3 Success: Account verified.`);

        // 4. Forgot Password
        console.log(`Step 4: Requesting Forgot Password...`);
        const fpRes = await request.post(`${BASE_URL}/api/v1/auth/forgot-password`, {
            headers: MOBILE_HEADERS,
            data: { phone: payload.phone }
        });
        expect(fpRes.status()).toBe(200);
        const fpJson = await fpRes.json();
        const resetToken = fpJson.data?.token;
        expect(resetToken).toBeDefined();
        console.log(`✅ Step 4 Success: Received reset token.`);

        // 5. Fetch Reset OTP
        await new Promise(r => setTimeout(r, 1000));
        const resetOtp = await getOtpFromDb(payload.phone);
        console.log(`✅ Step 5 Success: Fetched Reset OTP: ${resetOtp}`);

        // 6. Verify Reset OTP
        console.log(`Step 6: Verifying Forgot Password OTP...`);
        const fpVerifyRes = await request.post(`${BASE_URL}/api/v1/auth/verification-code/${resetToken}`, {
            headers: MOBILE_HEADERS,
            data: { code: resetOtp }
        });
        expect(fpVerifyRes.status()).toBe(200);
        console.log(`✅ Step 6 Success: Reset code verified.`);

        // 7. Reset Password
        console.log(`Step 7: Resetting Password...`);
        const newPassword = 'NewPassword123!';
        const resetPassRes = await request.post(`${BASE_URL}/api/v1/auth/reset-password/${resetToken}`, {
            headers: MOBILE_HEADERS,
            data: { 
                password: newPassword,
                password_confirmation: newPassword
            }
        });
        expect(resetPassRes.status()).toBe(200);
        console.log(`✅ Step 7 Success: Password changed.`);

        // 8. Log In
        console.log(`Step 8: Logging in with New Password...`);
        const loginRes = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: {
                user: payload.phone,
                password: newPassword
            }
        });
        expect(loginRes.status()).toBe(200);
        const loginJson = await loginRes.json();
        expect(loginJson.success).toBe(true);
        expect(loginJson.data).toHaveProperty('accessToken');
        
        console.log(`✅ Step 8 Success: Logged in successfully! Received token.`);
        
        // Final DB Verification state enforcement (just to be completely sure it's active)
        console.log(`Step 9: Ensuring User is marked strictly Active in DB...`);
        const dbClient = new Client(DB_CONFIG);
        await dbClient.connect();
        try {
            await dbClient.query(`
                UPDATE users 
                SET status = 'active', is_active = '1'
                WHERE phone = $1
            `, [payload.phone]);
            console.log(`✅ User status explicitly marked active in DB.`);
        } finally {
            await dbClient.end();
        }

        console.log(`--- [COMPLEX USER E2E CIRCLE COMPLETE] ---\n`);
    });
});
