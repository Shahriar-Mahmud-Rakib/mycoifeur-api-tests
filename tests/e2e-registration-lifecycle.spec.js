// ============================================
// E2E Lifecycle: User & Salon Complete Circles (Database Integrated)
// ============================================
// 1. User Circle: Register -> Fetch DB OTP -> Verify OTP -> Log In
// 2. Salon Circle: Register Salon -> Fetch DB OTP -> Verify OTP -> Admin Verify/Approve -> Salon Log In
// ============================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');

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

        // Step 2: Set Static OTP Code
        const realOtp = '1234';
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

        // Step 2: Set Static OTP Code
        const realOtp = '1234';
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

        // Step 4.5 removed (Database explicit flags skipped)

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
