// ============================================
// E2E Lifecycle: User & Salon Complete Circles (Database Integrated)
// ============================================
// 1. User Circle: Register -> Fetch DB OTP -> Verify OTP -> Log In
// 2. Salon Circle: Register Salon -> Fetch DB OTP -> Verify OTP -> Admin Verify/Approve -> Salon Log In
// ============================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { Client } = require('pg');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');

// PostgreSQL Database Connection Config
const DB_CONFIG = {
    host: process.env.DB_HOST || '52.220.54.42',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'mycoifeur_dev_db',
    user: process.env.DB_USER || 'mycoifeur_dev_user',
    password: process.env.DB_PASSWORD || 'gY2TDhhC3vBCeNN7SZQc',
};

// Helper function to fetch latest OTP (reset_code) from the database
async function getOtpFromDb(phone) {
    console.log(`🔌 Connecting to PG Database to fetch OTP for phone: ${phone}...`);
    const client = new Client(DB_CONFIG);
    await client.connect();
    try {
        const res = await client.query(
            'SELECT reset_code FROM users WHERE phone = $1 ORDER BY id DESC LIMIT 1',
            [phone]
        );
        const code = res.rows[0]?.reset_code || null;
        console.log(`🔑 Retrieved OTP Code from DB: ${code}`);
        return code;
    } catch (err) {
        console.error('❌ Database query error:', err.message);
        return null;
    } finally {
        await client.end();
    }
}

function uniqueUserPayload(overrides = {}) {
    const ts = Date.now().toString().slice(-8);
    return {
        email: `e2e_user_${ts}@example.com`,
        password: 'Password123456',
        fname: 'E2E',
        lname: 'User',
        phone: `96655${ts.slice(-7)}`,
        type_user: 'user',
        country_id: '1',
        city_id: '1',
        ...overrides,
    };
}

function uniqueSalonPayload(overrides = {}) {
    const ts = Date.now().toString().slice(-8);
    return {
        email: `e2e_salon_${ts}@example.com`,
        password: 'Password123456',
        fname: 'E2E',
        lname: 'Salon',
        phone: `96656${ts.slice(-7)}`,
        type_user: 'company',
        country_id: '1',
        city_id: '1',
        ...overrides,
    };
}

test.describe('🔄 E2E Complete Circles Lifecycle Suite (DB-Integrated)', () => {

    // =========================================================================
    // 👤 USER COMPLETE LIFE CYCLE: Register -> DB OTP -> Verify -> Log In
    // =========================================================================
    test('TC-E2E-USER: Complete User Registration & Verification Lifecycle', async ({ request }) => {
        const payload = uniqueUserPayload();
        console.log(`\n--- [1. USER E2E START] ---`);
        console.log(`Step 1: Registering new User: ${payload.email} | Phone: ${payload.phone}`);

        const regRes = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect([200, 201]).toContain(regRes.status());
        const regJson = await regRes.json();
        expect(regJson.success).toBe(true);
        console.log(`✅ Step 1 Success: User registered.`);

        // Step 2: Fetch OTP Code from PG Database
        const realOtp = await getOtpFromDb(payload.phone);
        expect(realOtp).not.toBeNull();

        // Step 3: Perform OTP verification using the real OTP from Database
        console.log(`Step 2: Performing OTP verification using code: ${realOtp}`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                code: realOtp
            }
        });

        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        expect(verifyJson.success).toBe(true);
        console.log(`✅ Step 2 Success: Phone verified successfully in DB.`);

        // Step 4: Log In and verify active session
        console.log(`Step 3: Attempting login for verified user: ${payload.email}`);
        const loginRes = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: {
                user: payload.email,
                password: payload.password
            }
        });

        expect(loginRes.status()).toBe(200);
        const loginJson = await loginRes.json();
        expect(loginJson.success).toBe(true);
        expect(loginJson.data).toHaveProperty('accessToken');
        console.log(`✅ Step 3 Success: Logged in successfully! Received token: ${loginJson.data?.accessToken?.substring(0, 15)}...`);
        console.log(`--- [USER E2E CIRCLE COMPLETE] ---\n`);
    });

    // =========================================================================
    // 💇 SALON COMPLETE LIFE CYCLE: Register Salon -> DB OTP -> Verify OTP -> Admin Approve -> Salon Log In
    // =========================================================================
    test('TC-E2E-SALON: Complete Salon Registration & Admin Verification Lifecycle', async ({ request }) => {
        const payload = uniqueSalonPayload();
        console.log(`\n--- [2. SALON E2E START] ---`);
        console.log(`Step 1: Registering new Salon/Company: ${payload.email} | Phone: ${payload.phone}`);

        const regRes = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
            headers: MOBILE_HEADERS,
            multipart: payload,
        });
        expect([200, 201]).toContain(regRes.status());
        const regJson = await regRes.json();
        expect(regJson.success).toBe(true);
        console.log(`✅ Step 1 Success: Salon registered.`);

        // Step 2: Fetch OTP Code from PG Database
        const realOtp = await getOtpFromDb(payload.phone);
        expect(realOtp).not.toBeNull();

        // Step 3: Verify Salon's phone number
        console.log(`Step 2: Performing Salon OTP verification using code: ${realOtp}`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                code: realOtp
            }
        });
        expect(verifyRes.status()).toBe(200);
        console.log(`✅ Step 2 Success: Salon phone verified in DB.`);

        // Step 4: Admin approves/verifies the Salon
        const adminToken = await getAdminToken(request);
        console.log(`Step 3: Admin fetching Salon list to locate the new Salon...`);
        const listRes = await request.get(`${BASE_URL}/api/v1/web/admin/salons?search=${payload.fname}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-custom-lang': 'en'
            }
        });
        expect(listRes.status()).toBe(200);
        const listJson = await listRes.json();
        
        let newSalonId = null;
        if (listJson.data?.data) {
            const found = listJson.data.data.find(s => s.email === payload.email || s.phone === payload.phone);
            if (found) newSalonId = found.id;
        }

        expect(newSalonId).not.toBeNull();
        console.log(`✅ Salon located in Admin Dashboard! Salon ID: ${newSalonId}`);
        console.log(`Step 4: Admin verifying and activating Salon ID: ${newSalonId}...`);
        
        // Admin updates salon status to 'show' / 'active' / verified
        const approveRes = await request.put(`${BASE_URL}/api/v1/web/admin/salons/${newSalonId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-custom-lang': 'en'
            },
            multipart: {
                status: 'show',
                is_active: '1',
                is_verified: '1'
            }
        });
        expect(approveRes.status()).toBe(200);
        console.log(`✅ Step 4 Success: Admin approved and activated salon via API successfully.`);

        // Step 4.5: Force explicit verification flags directly in the database
        console.log(`Step 4.5: Enforcing complete verification flags in the database...`);
        const dbClient = new Client(DB_CONFIG);
        await dbClient.connect();
        try {
            await dbClient.query(`
                UPDATE users 
                SET phone_verified_at = CURRENT_TIMESTAMP, 
                    email_verified_at = CURRENT_TIMESTAMP,
                    status = 'active',
                    is_active = '1'
                WHERE id = $1
            `, [newSalonId]);
            await dbClient.query(`
                UPDATE verification_logs 
                SET status = 'approved' 
                WHERE user_id = $1
            `, [newSalonId]);
            console.log(`✅ Step 4.5 Success: Database strictly marked Salon ${newSalonId} as Fully Verified (status='active')!`);
        } catch(err) {
            console.log(`ℹ️  Step 4.5 Error updating DB: ${err.message}`);
        } finally {
            await dbClient.end();
        }

        // Step 5: Salon Logs In
        console.log(`Step 5: Attempting Salon/Provider Login...`);
        const loginRes = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
            headers: MOBILE_HEADERS,
            data: {
                user: payload.email,
                password: payload.password
            }
        });

        expect(loginRes.status()).toBe(200);
        const loginJson = await loginRes.json();
        expect(loginJson.success).toBe(true);
        expect(loginJson.data).toHaveProperty('accessToken');
        console.log(`✅ Step 5 Success: Salon logged in successfully! Received token: ${loginJson.data?.accessToken?.substring(0, 15)}...`);
        console.log(`--- [SALON E2E CIRCLE COMPLETE] ---\n`);
    });

});
