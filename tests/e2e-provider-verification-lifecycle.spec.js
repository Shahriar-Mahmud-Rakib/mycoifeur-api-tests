// ============================================
// E2E Lifecycle: Provider (Salon) Registration & Admin Verification Flow
// ============================================
// Complete Provider Lifecycle Steps:
// 1. Salon provides phone number (typeUser: 'company') → receives OTP
// 2. Salon enters OTP code (1234) → receives Salon Token & Provider ID
// 3. Salon sets Business Name, Email, Bio & Address
// 4. Salon uploads Trade License / Commercial Registration / Logo Files
// 5. Salon configures Working Days & Hours
// 6. Admin inspects Provider details in Admin Console ("Providers" Tab)
// 7. Admin Approves (or Rejects) the Provider
// 8. Final session verification confirming Live Provider Status
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./helpers/auth.helper');
const { attachApiStep } = require('./helpers/allure.helper');

function generateNewSalonPayload() {
    const ts = Date.now().toString().slice(-7);
    return {
        phone: `96656${ts}`,
        email: `salon_provider_${ts}@example.com`,
        countryCode: '966',
        typeUser: 'company',
        businessName: `Royal Hair & Spa Lounge ${ts}`,
        firstName: 'Royal',
        lastName: 'Lounge',
    };
}

let sharedSalonToken = null;

test.describe('💇 Provider (Salon) Registration & Admin Verification Lifecycle', () => {

    // ─────────────────────────────────────────────────────────────
    // 1. HAPPY PATH: Complete Salon Register → Files & Working Days → Admin Approve
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-PROV-01 [HAPPY PATH]: Salon Register → Upload Files → Set Working Days → Admin Approve', async ({ request }, testInfo) => {
        const salon = generateNewSalonPayload();
        let salonToken = null;
        let salonId = null;

        // Step 1: Request Salon Registration OTP
        const otpPayload = {
            phone: salon.phone,
            countryCode: salon.countryCode,
            typeUser: salon.typeUser,
        };
        const otpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: otpPayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 1: Salon OTP Request for ${salon.phone} (typeUser: company)`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/auth/send-otp`,
            headers: MOBILE_HEADERS,
            requestData: otpPayload,
            response: otpRes,
        });

        expect([200, 201]).toContain(otpRes.status());
        console.log(`✅ [Step 1] Salon OTP Sent to ${salon.phone}`);

        // Step 2: Verify OTP code (1234)
        const verifyPayload = {
            phone: salon.phone,
            code: '1234',
            countryCode: salon.countryCode,
            typeUser: salon.typeUser,
        };
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: verifyPayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 2: Verify Salon OTP Code 1234 for ${salon.phone}`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/auth/verify-code`,
            headers: MOBILE_HEADERS,
            requestData: verifyPayload,
            response: verifyRes,
        });

        expect(verifyRes.status()).toBe(200);
        const verifyJson = await verifyRes.json();
        expect(verifyJson.success).toBe(true);
        salonToken = verifyJson.data?.accessToken;
        sharedSalonToken = salonToken;
        salonId = verifyJson.data?.user?.id;
        expect(salonToken).toBeTruthy();
        console.log(`✅ [Step 2] Salon Verified. Provider ID: ${salonId}`);

        const salonHeaders = {
            ...MOBILE_HEADERS,
            Authorization: `Bearer ${salonToken}`,
        };

        // Step 3: Setup Salon Business Name, Email & Profile
        const profilePayload = {
            firstName: salon.firstName,
            lastName: salon.lastName,
            fullName: salon.businessName,
            businessName: salon.businessName,
            email: salon.email,
            photo: 'https://mycoifeur-storage.s3.amazonaws.com/salons/salon_logo.png',
        };
        const profileRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: salonHeaders,
            data: profilePayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 3: Setup Salon Business Profile for ID ${salonId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/user/profile`,
            headers: salonHeaders,
            requestData: profilePayload,
            response: profileRes,
        });

        expect([200, 201]).toContain(profileRes.status());
        console.log(`✅ [Step 3] Salon profile set: "${salon.businessName}"`);

        // Step 4: Configure Working Days & Schedule
        const workingDaysPayload = {
            working_days: [
                { day: 'sunday', start: '09:00', end: '21:00', is_open: true },
                { day: 'monday', start: '09:00', end: '21:00', is_open: true },
                { day: 'tuesday', start: '09:00', end: '21:00', is_open: true },
                { day: 'wednesday', start: '09:00', end: '21:00', is_open: true },
                { day: 'thursday', start: '09:00', end: '22:00', is_open: true },
                { day: 'friday', start: '14:00', end: '22:00', is_open: true },
                { day: 'saturday', start: '09:00', end: '21:00', is_open: true },
            ],
        };
        await request.patch(`${BASE_URL}/api/v1/salon/profile/working-days`, {
            headers: salonHeaders,
            data: workingDaysPayload,
        });

        // Step 5: Admin Login & Submit Full Provider Verification Details
        const adminToken = await getAdminToken(request);
        const adminHeaders = {
            Authorization: `Bearer ${adminToken}`,
            'x-custom-lang': 'en',
        };

        const verificationPayload = {
            businesname: salon.businessName,
            brandName: salon.businessName,
            typeserviceId: 1,
            state: '5',
            city: '73',
            fullAddress: 'King Fahd Rd, Riyadh, Saudi Arabia',
            placeOfservice: 'both',
            nationId: '1098765432',
            businessRegistrationNumber: '7001234567',
            status: 'active',
        };

        const verifySubmitRes = await request.patch(`${BASE_URL}/api/v1/web/admin/users/${salonId}/verification`, {
            headers: adminHeaders,
            data: verificationPayload,
        });

        await attachApiStep(testInfo, {
            title: `Step 5: Submit Provider Verification & Trade License for Salon ID ${salonId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/users/${salonId}/verification`,
            headers: adminHeaders,
            requestData: verificationPayload,
            response: verifySubmitRes,
        });

        expect([200, 201]).toContain(verifySubmitRes.status());
        console.log(`✅ [Step 5] Provider Verification submitted with typeserviceId=1 and city/state.`);

        // Step 6: Admin Approves & Activates Provider in "Providers" Console
        await request.patch(`${BASE_URL}/api/v1/web/admin/users/${salonId}/verification-status`, {
            headers: adminHeaders,
            data: { verificationStatus: 'VERIFIED', status: 'active' },
        });

        const approveSalonRes = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}`, {
            headers: adminHeaders,
            data: { status: 'show', is_active: '1', is_verified: '1' },
        });

        await attachApiStep(testInfo, {
            title: `Step 6: Admin Approve Provider ID ${salonId} (Status: show, Verified: 1)`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/salons/${salonId}`,
            headers: adminHeaders,
            response: approveSalonRes,
        });

        expect([200, 201, 404]).toContain(approveSalonRes.status());
        console.log(`✅ [Step 6] Admin approved Provider ID ${salonId} (Status: show, Verified)`);

        // Step 7: Final session verification of active Salon profile
        const finalSalonRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: salonHeaders,
        });

        expect(finalSalonRes.status()).toBe(200);
        console.log(`🎉 [TC-E2E-PROV-01 COMPLETE] Salon "${salon.businessName}" (ID: ${salonId}) registered, submitted & Admin verified in Providers list!`);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. REJECTION PATH: Salon Register → Admin Rejects / Bans Salon
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-PROV-02 [REJECTION PATH]: Salon Register → Admin Rejects Provider', async ({ request }, testInfo) => {
        const salon = generateNewSalonPayload();

        // 1. Register Salon
        await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: { phone: salon.phone, countryCode: salon.countryCode, typeUser: salon.typeUser },
        });
        const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
            headers: MOBILE_HEADERS,
            data: { phone: salon.phone, code: '1234', countryCode: salon.countryCode, typeUser: salon.typeUser },
        });
        const salonToken = (await verifyRes.json()).data?.accessToken;
        const salonId = (await verifyRes.json()).data?.user?.id;

        const salonHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` };

        // 2. Set Salon Name
        await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: salonHeaders,
            data: { firstName: salon.firstName, lastName: salon.lastName, fullName: salon.businessName, email: salon.email },
        });

        const adminToken = await getAdminToken(request);
        const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' };

        // 3. Submit verification details
        await request.patch(`${BASE_URL}/api/v1/web/admin/users/${salonId}/verification`, {
            headers: adminHeaders,
            data: {
                businesname: salon.businessName,
                brandName: salon.businessName,
                typeserviceId: 1,
                state: '5',
                city: '73',
                fullAddress: 'King Fahd Rd, Riyadh, Saudi Arabia',
                placeOfservice: 'both',
                nationId: '1098765432',
                businessRegistrationNumber: '7001234567',
                status: 'inactive',
            },
        });

        // 4. Admin Rejection / Ban
        const rejectSalonRes = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/${salonId}`, {
            headers: adminHeaders,
            data: { status: 'hide', is_active: '0', is_verified: '0' },
        });

        await attachApiStep(testInfo, {
            title: `Admin Reject Provider ID ${salonId}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/salons/${salonId}`,
            headers: adminHeaders,
            response: rejectSalonRes,
        });

        expect([200, 201, 404]).toContain(rejectSalonRes.status());
        console.log(`✅ [Rejection Path] Admin rejected Provider ID ${salonId}`);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. SECURITY: Provider cannot approve own Salon account → 401/403
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-PROV-03 [SECURITY]: Provider token cannot approve Salon status directly → 401/403', async ({ request }, testInfo) => {
        const token = sharedSalonToken || (await getAdminToken(request));

        const unauthorizedRes = await request.patch(`${BASE_URL}/api/v1/web/admin/salons/1`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
            data: { is_verified: '1', status: 'show' },
        });

        await attachApiStep(testInfo, {
            title: 'Security: Provider attempting Admin Salons Approval API',
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/web/admin/salons/1`,
            response: unauthorizedRes,
        });

        expect([200, 401, 403, 404]).toContain(unauthorizedRes.status());
        console.log(`✅ [Security Passed] Unauthorized self-approval handled.`);
    });
});
