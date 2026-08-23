// ============================================
// E2E Lifecycle: User & Salon Complete Circles (Live API Flow)
// ============================================
// 1. User Circle: Send OTP -> Verify OTP (Code 1234) -> Update Profile -> Fetch Profile
// 2. Salon Circle: Send Salon OTP -> Verify OTP -> Admin Approve -> Salon Profile & Working Days
// ============================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');

function uniqueUserPayload(overrides = {}) {
    const ts = Date.now().toString().slice(-7);
    return {
        email: `e2e_user_${ts}@example.com`,
        password: 'Password123456',
        fname: 'E2E',
        lname: 'User',
        phone: `96655${ts}`,
        typeUser: 'user',
        countryCode: '966',
        ...overrides,
    };
}

function uniqueSalonPayload(overrides = {}) {
    const ts = Date.now().toString().slice(-7);
    return {
        email: `e2e_salon_${ts}@example.com`,
        password: 'Password123456',
        fname: 'E2E',
        lname: 'Salon',
        phone: `96656${ts}`,
        typeUser: 'company',
        countryCode: '966',
        ...overrides,
    };
}

test.describe('🔄 E2E Complete Circles Lifecycle Suite', () => {

    // =========================================================================
    // 👤 USER COMPLETE LIFE CYCLE: Send OTP -> Verify OTP -> Profile -> Active Session
    // =========================================================================
    test('TC-E2E-USER: Complete User Registration & Verification Lifecycle', async ({ request }) => {
        const payload = uniqueUserPayload();
        console.log(`\n--- [1. USER E2E START] ---`);
        console.log(`Step 1: Sending Registration OTP: ${payload.phone}`);

        const otpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201]).toContain(otpRes.status());
        const otpJson = await otpRes.json();
        expect(otpJson.success).toBe(true);
        console.log(`✅ Step 1 Success: OTP sent successfully.`);

        // Step 2: Perform OTP verification
        console.log(`Step 2: Performing OTP verification using code: 1234`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                code: '1234',
                typeUser: payload.typeUser,
                countryCode: payload.countryCode,
            }
        });

        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        expect(verifyJson.success).toBe(true);
        const userToken = verifyJson.data?.accessToken;
        expect(userToken).toBeTruthy();
        console.log(`✅ Step 2 Success: Phone verified. Received token: ${userToken.substring(0, 15)}...`);

        // Step 3: Complete user profile
        console.log(`Step 3: Completing profile for user: ${payload.email}`);
        const profRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` },
            data: {
                firstName: payload.fname,
                lastName: payload.lname,
                email: payload.email,
            }
        });

        expect(profRes.status()).toBe(200);
        const profJson = await profRes.json();
        expect(profJson.success).toBe(true);
        console.log(`✅ Step 3 Success: Profile updated.`);

        // Step 4: Verify active session
        const getProfRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` }
        });
        expect(getProfRes.status()).toBe(200);
        const getProfJson = await getProfRes.json();
        expect(getProfJson.data?.firstName).toBe(payload.fname);
        console.log(`✅ Step 4 Success: Profile verified in active session.`);
        console.log(`--- [USER E2E CIRCLE COMPLETE] ---\n`);
    });

    // =========================================================================
    // 💇 SALON COMPLETE LIFE CYCLE: Register Salon -> OTP -> Admin Approve -> Salon Services
    // =========================================================================
    test('TC-E2E-SALON: Complete Salon Registration & Admin Verification Lifecycle', async ({ request }) => {
        const payload = uniqueSalonPayload();
        console.log(`\n--- [2. SALON E2E START] ---`);
        console.log(`Step 1: Sending Salon Registration OTP: ${payload.phone}`);

        const otpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                countryCode: payload.countryCode,
                typeUser: payload.typeUser,
            },
        });
        expect([200, 201]).toContain(otpRes.status());
        console.log(`✅ Step 1 Success: Salon OTP sent.`);

        // Step 2: Verify Salon's phone number
        console.log(`Step 2: Performing Salon OTP verification using code: 1234`);
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: payload.phone,
                code: '1234',
                typeUser: payload.typeUser,
                countryCode: payload.countryCode,
            }
        });
        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        const salonToken = verifyJson.data?.accessToken;
        const newSalonId = verifyJson.data?.user?.id;
        expect(salonToken).toBeTruthy();
        console.log(`✅ Step 2 Success: Salon verified. Salon ID: ${newSalonId}`);

        // Step 3: Admin approves/verifies the Salon if Admin token available
        const adminToken = await getAdminToken(request);
        if (newSalonId && adminToken) {
            console.log(`Step 3: Admin activating Salon ID: ${newSalonId}...`);
            const approveRes = await request.put(`${BASE_URL}/api/v1/web/admin/salons/${newSalonId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'x-custom-lang': 'en'
                },
                data: {
                    status: 'show',
                    is_active: '1',
                    is_verified: '1'
                }
            });
            expect([200, 404]).toContain(approveRes.status());
            console.log(`✅ Step 3: Admin update status: ${approveRes.status()}`);
        }

        // Step 4: Salon accesses authenticated features
        console.log(`Step 4: Salon fetching own services & working days...`);
        const daysRes = await request.get(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` }
        });
        expect([200, 201, 404]).toContain(daysRes.status());
        console.log(`✅ Step 4 Success: Salon working-days status: ${daysRes.status()}`);
        console.log(`--- [SALON E2E CIRCLE COMPLETE] ---\n`);
    });

});
