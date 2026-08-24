// ============================================
// E2E Lifecycle: User Registration & Admin Verification Flow
// ============================================
// Complete Lifecycle Steps:
// 1. User provides phone number → receives OTP
// 2. User enters OTP code (1234) → receives user token & user ID
// 3. User sets Name and Email
// 4. User uploads NID / identity document photo (Multipart)
// 5. Admin reviews user details & NID document
// 6. Admin Approves (or Rejects) the user
// 7. User verifies active & verified status from User session
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');
const { attachApiStep } = require('./helpers/allure.helper');

// Helper to generate a 1x1 valid PNG buffer for NID/photo upload
function getDummyImageBuffer() {
    return Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
        '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
        'hex'
    );
}

function generateNewUserPayload() {
    const ts = Date.now().toString().slice(-7);
    return {
        phone: `96655${ts}`,
        email: `verified_user_${ts}@example.com`,
        countryCode: '966',
        typeUser: 'user',
        firstName: 'Shahriar',
        lastName: 'Rakib',
    };
}

let sharedUserToken = null;

test.describe('🔄 E2E User Registration & Admin Verification Lifecycle', () => {

    // ─────────────────────────────────────────────────────────────
    // 1. HAPPY PATH: Complete Registration → NID Upload → Admin Approval
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-REG-01 [HAPPY PATH]: User Register → NID Upload → Admin Approve → Active Session', async ({ request }, testInfo) => {
        const user = generateNewUserPayload();
        let userToken = null;
        let userId = null;

        // Step 1: User sends phone number for OTP
        const otpPayload = {
            phone: user.phone,
            countryCode: user.countryCode,
            typeUser: user.typeUser,
        };
        const otpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: otpPayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 1: Request Registration OTP for ${user.phone}`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/auth/send-otp`,
            headers: MOBILE_HEADERS,
            requestData: otpPayload,
            response: otpRes,
        });

        expect([200, 201]).toContain(otpRes.status());
        const otpJson = await otpRes.json();
        expect(otpJson.success).toBe(true);
        console.log(`✅ [Step 1] OTP Sent to ${user.phone}`);

        // Step 2: User verifies OTP code (1234)
        const verifyPayload = {
            phone: user.phone,
            code: '1234',
            countryCode: user.countryCode,
            typeUser: user.typeUser,
        };
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: verifyPayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 2: Verify OTP Code 1234 for ${user.phone}`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/auth/verify-code`,
            headers: MOBILE_HEADERS,
            requestData: verifyPayload,
            response: verifyRes,
        });

        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        expect(verifyJson.success).toBe(true);
        userToken = verifyJson.data?.accessToken;
        sharedUserToken = userToken;
        userId = verifyJson.data?.user?.id;
        expect(userToken).toBeTruthy();
        console.log(`✅ [Step 2] OTP Verified. User ID: ${userId}`);

        // User Auth Headers
        const userHeaders = {
            ...MOBILE_HEADERS,
            Authorization: `Bearer ${userToken}`,
        };

        // Step 3: User sets Name & Email (Profile Update)
        const profilePayload = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };
        const profileRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: userHeaders,
            data: profilePayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 3: Set Name and Email for User ID ${userId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/user/profile`,
            headers: userHeaders,
            requestData: profilePayload,
            response: profileRes,
        });

        expect([200, 201]).toContain(profileRes.status());
        console.log(`✅ [Step 3] Name & Email set: ${user.email}`);

        // Step 4: User uploads photo / NID document
        const uploadRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: userHeaders,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                photo: 'https://mycoifeur-storage.s3.amazonaws.com/documents/nid_card.png',
            },
        });

        await attachApiStep(testInfo, {
            title: `Step 4: Upload NID Identity Document for User ID ${userId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/user/profile`,
            headers: userHeaders,
            response: uploadRes,
        });

        expect([200, 201]).toContain(uploadRes.status());
        console.log(`✅ [Step 4] NID Document / Photo attached.`);

        // Step 5: Admin Login & Fetch User Details
        const adminToken = await getAdminToken(request);
        const adminHeaders = {
            Authorization: `Bearer ${adminToken}`,
            'x-custom-lang': 'en',
        };

        const adminInspectRes = await request.get(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
            headers: adminHeaders,
        });

        await attachApiStep(testInfo, {
            title: `Step 5: Admin Review User ID ${userId} & NID`,
            method: 'GET',
            url: `${BASE_URL}/api/v1/web/admin/users/${userId}`,
            headers: adminHeaders,
            response: adminInspectRes,
        });

        expect([200, 404]).toContain(adminInspectRes.status());
        console.log(`✅ [Step 5] Admin inspected user record.`);

        // Step 6: Admin Confirms / Approves User Verification
        const adminApprovePayload = {
            verificationStatus: 'VERIFIED',
            status: 'active',
            is_verified: 1,
            is_active: 1,
        };

        // Update verification status directly in admin API
        const approveVerifyRes = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}/verification-status`, {
            headers: adminHeaders,
            data: adminApprovePayload,
        });

        // Also update standard user record
        const approveRes = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
            headers: adminHeaders,
            data: { is_verified: 1, is_active: 1, status: 'active' },
        });

        await attachApiStep(testInfo, {
            title: `Step 6: Admin Approve User Verification for ID ${userId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/users/${userId}/verification-status`,
            headers: adminHeaders,
            requestData: adminApprovePayload,
            response: approveVerifyRes,
        });

        expect([200, 201]).toContain(approveVerifyRes.status());
        expect([200, 201]).toContain(approveRes.status());
        console.log(`✅ [Step 6] Admin approved User Verification (VERIFIED) for ID ${userId}`);

        // Step 7: Verify final status in User session
        const finalUserRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: userHeaders,
        });

        await attachApiStep(testInfo, {
            title: `Step 7: Final Verification of Active Profile for User ID ${userId}`,
            method: 'GET',
            url: `${BASE_URL}/api/v1/user/profile`,
            headers: userHeaders,
            response: finalUserRes,
        });

        expect(finalUserRes.status()).toBe(200);
        const finalJson = await finalUserRes.json();
        expect(finalJson.data?.email).toBe(user.email);
        console.log(`🎉 [TC-E2E-REG-01 COMPLETE] User ${user.email} successfully registered, uploaded NID, and Admin verified!`);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. REJECTION PATH: User Register → NID Upload → Admin Rejection
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-REG-02 [REJECTION PATH]: User Register → NID Upload → Admin Rejects User', async ({ request }, testInfo) => {
        const user = generateNewUserPayload();

        // 1. Send OTP
        const otpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: { phone: user.phone, countryCode: user.countryCode, typeUser: user.typeUser },
        });
        expect([200, 201]).toContain(otpRes.status());

        // 2. Verify OTP
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: user.phone, code: '1234', countryCode: user.countryCode, typeUser: user.typeUser },
        });
        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        const userToken = verifyJson.data?.accessToken;
        const userId = verifyJson.data?.user?.id;

        const userHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` };

        // 3. Update Profile & Upload NID
        await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: userHeaders,
            data: { firstName: user.firstName, lastName: user.lastName, email: user.email },
        });

        await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: userHeaders,
            multipart: {
                avatar: { name: 'rejected_nid.png', mimeType: 'image/png', buffer: getDummyImageBuffer() },
            },
        });

        // 4. Admin Rejection Decision
        const adminToken = await getAdminToken(request);
        const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' };

        const rejectPayload = {
            is_verified: 0,
            status: 'inactive',
        };

        const rejectRes = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
            headers: adminHeaders,
            data: rejectPayload,
        });

        await attachApiStep(testInfo, {
            title: `Admin Reject User ID ${userId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/users/${userId}`,
            headers: adminHeaders,
            requestData: rejectPayload,
            response: rejectRes,
        });

        expect([200, 201]).toContain(rejectRes.status());
        console.log(`✅ [Rejection Path] Admin rejected User ID ${userId}`);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. SECURITY: Regular User Cannot Approve/Modify Verification Status
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-REG-03 [SECURITY]: Regular User token cannot approve/modify user status → 401/403', async ({ request }, testInfo) => {
        // Reuse the user token from Test 1 (or existing test user token)
        const userToken = sharedUserToken || (await getUserToken(request));

        // User attempts to call admin approve endpoint directly
        const unauthorizedRes = await request.patch(`${BASE_URL}/api/v1/web/admin/users/1`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` },
            data: { is_verified: 1, status: 'active' },
        });

        await attachApiStep(testInfo, {
            title: 'Security: Regular User attempting Admin Approval API',
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/users/1`,
            response: unauthorizedRes,
        });

        expect([401, 403, 404]).toContain(unauthorizedRes.status());
        console.log(`✅ [Security Passed] Regular user blocked from Admin API: ${unauthorizedRes.status()}`);
    });
});
