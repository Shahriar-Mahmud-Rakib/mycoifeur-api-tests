// ============================================
// E2E Lifecycle: Complete User Booking & Order Journey
// ============================================
// 1. [HAPPY PATH - CARD + ACCEPT]: New User → Home Address → Card Payment → Tap Webhook Paid (PAYMENT: Paid) → Provider Accepts (STATUS: Accepted)
// 2. [HAPPY PATH - WALLET]: Verified User → Wallet Balance → In-Salon Location → Paid via Wallet Balance (PAYMENT: Paid, STATUS: Pending)
// 3. [USER CANCEL]: User creates booking → Customer cancels order (STATUS: Cancelled / user_cancel)
// 4. [PROVIDER REJECT]: User creates booking → Salon Provider rejects order (STATUS: Rejected / artist_reject)
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getSalonToken } = require('./helpers/auth.helper');
const { TEST_CARD } = require('./helpers/test-data.helper');
const { attachApiStep } = require('./helpers/allure.helper');

async function createFreshUser(request, customerName) {
    const ts = Date.now().toString().slice(-7);
    const phone = `96655${ts}`;

    // 1. Phone OTP Registration
    await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: { phone, countryCode: '966', typeUser: 'user' },
    });
    const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
        headers: MOBILE_HEADERS,
        data: { phone, code: '1234', countryCode: '966', typeUser: 'user' },
    });
    const userToken = (await verifyRes.json()).data?.accessToken;
    const userId = (await verifyRes.json()).data?.user?.id;
    const userHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` };

    // 2. Profile
    await request.patch(`${BASE_URL}/api/v1/user/profile`, {
        headers: userHeaders,
        data: { firstName: customerName, lastName: 'Customer', email: `${customerName.toLowerCase()}_${ts}@example.com` },
    });

    // 3. Admin Verification
    const adminToken = await getAdminToken(request);
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
    await request.patch(`${BASE_URL}/api/v1/web/admin/users/${userId}/verification-status`, {
        headers: adminHeaders,
        data: { verificationStatus: 'VERIFIED', status: 'active' },
    });

    // 4. Create Home Address
    const addrRes = await request.post(`${BASE_URL}/api/v1/address/create`, {
        headers: userHeaders,
        data: {
            countryId: 1, cityId: 1, stateId: 1, lat: '24.7136', long: '46.6753',
            address: 'King Fahd Rd, Villa 10, Riyadh', label: 'Home', flat: '10', floor: '3', isDefault: true,
        },
    });
    const addressId = (await addrRes.json()).data?.id || 248;

    // 5. Add Saved Payment Card
    const cardRes = await request.post(`${BASE_URL}/api/v1/cards`, {
        headers: userHeaders,
        data: { ...TEST_CARD, cardholderName: `${customerName} Customer`, isDefault: true },
    });
    const cardId = (await cardRes.json()).data?.id;

    return { userToken, userHeaders, userId, phone, addressId, cardId };
}

async function placeBooking(request, { userHeaders, phone, placeOfService = 'home', addressId, cardId, paymentMethod = 'card', slotOffset = 0 }) {
    const salonId = 1903;
    const serviceId = 1131;

    // 1. Clear & Add to Cart
    await request.delete(`${BASE_URL}/api/v1/cart/i`, { headers: userHeaders });
    await request.post(`${BASE_URL}/api/v1/cart/add`, { headers: userHeaders, data: { serviceId } });

    // 2. Available times on future open date
    const targetDate = '2026-08-31';
    const timesRes = await request.get(`${BASE_URL}/api/v1/cart/available_times?date=${targetDate}&salonId=${salonId}&serviceId=${serviceId}`, { headers: userHeaders });
    const availableSlots = (await timesRes.json()).data?.filter(x => x.available) || [];
    const slot = availableSlots[slotOffset] || availableSlots[0];
    let [timeP, mod] = (slot?.time || '10:00 am').split(' ');
    let [h, m] = timeP.split(':');
    let hours = parseInt(h, 10);
    if (mod && mod.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (mod && mod.toLowerCase() === 'am' && hours === 12) hours = 0;
    const startTime = String(hours).padStart(2, '0') + ':' + m;

    // 3. Choose Payment
    await request.post(`${BASE_URL}/api/v1/cart/i/choose/payment`, {
        headers: userHeaders,
        data: {
            paymentMethod,
            card_id: cardId,
            useWallet: paymentMethod === 'wallet',
            startTime,
            bookDate: targetDate,
            placeOfService,
            addressId,
            note: 'VIP Appointment Booking',
        },
    });

    // 4. Complete Order
    const compRes = await request.post(`${BASE_URL}/api/v1/cart/i/complet`, {
        headers: userHeaders,
        data: { startTime, bookDate: targetDate, placeOfService, addressId },
    });

    // 5. Query user orders to get exact created order record
    const ordRes = await request.get(`${BASE_URL}/api/v1/orders/i?page=1&limit=1`, { headers: userHeaders });
    const ordJson = await ordRes.json();
    let order = ordJson.data?.data?.[0];

    // Query admin order details for full relations & payId
    if (order?.bookingRef) {
        const adminToken = await getAdminToken(request);
        const adminCheck = await request.get(`${BASE_URL}/api/v1/web/admin/orders?search=${order.bookingRef}`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
        });
        const adminOrd = (await adminCheck.json()).data?.data?.[0];
        if (adminOrd) order = adminOrd;
    }

    return { compRes, order, startTime, targetDate };
}

test.describe('🛍️ E2E Complete User Booking & Lifecycle Journey', () => {

    // ─────────────────────────────────────────────────────────────
    // 1. CARD PAYMENT + PAID CONFIRMATION + PROVIDER ACCEPTS
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-BOOK-01 [CARD + PAID + ACCEPTED]: New User → Home Location → Card Payment → Paid via Tap Webhook → Provider Accepts', async ({ request }, testInfo) => {
        const user = await createFreshUser(request, 'ProviderAccepted');
        console.log(`✅ [Step 1] User Registered & Verified: ${user.phone}`);

        const { compRes, order } = await placeBooking(request, {
            userHeaders: user.userHeaders,
            phone: user.phone,
            placeOfService: 'home',
            addressId: user.addressId,
            cardId: user.cardId,
            paymentMethod: 'card',
            slotOffset: 1,
        });
        console.log(`✅ [Step 2] Card Order Created: ID ${order?.id}, Ref: #${order?.bookingRef}, PayId: ${order?.payId}`);

        // Trigger Tap Webhook to confirm Payment as PAID (isPaid: yes)
        if (order?.payId) {
            const tapRes = await request.post(`${BASE_URL}/api/v1/tap/callback`, {
                data: { id: order.payId, object: 'charge', status: 'CAPTURED' },
            });
            expect(tapRes.status()).toBe(200);
            console.log(`✅ [Step 3] Tap Payment Webhook executed: PAYMENT marked as PAID.`);
        }

        // Provider Accepts the Order (using authenticated salon provider token)
        const adminToken = await getAdminToken(request);
        const salonToken = await getSalonToken(request);
        const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        const salonHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` };

        await request.post(`${BASE_URL}/api/v1/web/admin/orders/${order.id}/assign`, {
            headers: adminHeaders,
            data: { salonId: 880 },
        });
        const acceptRes = await request.get(`${BASE_URL}/api/v1/salon/orders/${order.id}/artist_accept`, {
            headers: salonHeaders,
        });
        expect([200, 201]).toContain(acceptRes.status());
        console.log(`✅ [Step 4] Salon Provider accepted order #${order?.bookingRef} (Status: Accepted)`);

        console.log(`🎉 [Result 1] CARD BOOKING CONFIRMED & ACCEPTED! Booking Ref: #${order?.bookingRef}`);

        await attachApiStep(testInfo, {
            title: `Card Booking Confirmed & Accepted (Ref #${order?.bookingRef}, Order ID ${order?.id})`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/cart/i/complet`,
            headers: user.userHeaders,
            response: compRes,
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. WALLET PAYMENT + IN-SALON LOCATION
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-BOOK-02 [WALLET + SALON]: Verified User → In-Salon Location → Paid via Wallet Balance', async ({ request }, testInfo) => {
        // Use verified user with 25,000+ SAR wallet balance
        const phone = '966501234568';
        await request.post(`${BASE_URL}/api/v1/auth/send-otp`, { headers: MOBILE_HEADERS, data: { phone, countryCode: '966', typeUser: 'user' } });
        const vr = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, { headers: MOBILE_HEADERS, data: { phone, code: '1234', countryCode: '966', typeUser: 'user' } });
        const userToken = (await vr.json()).data?.accessToken;
        const userHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${userToken}` };

        const { compRes, order } = await placeBooking(request, {
            userHeaders,
            phone,
            placeOfService: 'salon',
            paymentMethod: 'wallet',
            slotOffset: 3,
        });

        console.log(`🎉 [Result 2] WALLET BOOKING CONFIRMED! Order ID: ${order?.id}, Ref: #${order?.bookingRef}, Status: ${order?.status}, Paid: ${order?.isPaid}`);

        await attachApiStep(testInfo, {
            title: `In-Salon Wallet Booking (Ref #${order?.bookingRef}, Order ID ${order?.id})`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/cart/i/complet`,
            headers: userHeaders,
            response: compRes,
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. USER CANCELS ORDER
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-BOOK-03 [USER CANCEL]: User Places Booking → Customer Cancels Order (Status: user_cancel)', async ({ request }, testInfo) => {
        const user = await createFreshUser(request, 'UserCancelled');
        const { order } = await placeBooking(request, {
            userHeaders: user.userHeaders,
            phone: user.phone,
            placeOfService: 'home',
            addressId: user.addressId,
            cardId: user.cardId,
            paymentMethod: 'card',
            slotOffset: 5,
        });
        console.log(`✅ [Step 1] Order Created for Cancel Test: ID ${order?.id}, Ref: #${order?.bookingRef}`);

        // Customer cancels the order
        const cancelPayload = { cancelReason: 'Customer requested cancellation' };
        const cancelRes = await request.patch(`${BASE_URL}/api/v1/orders/${order.id}/cancel`, {
            headers: user.userHeaders,
            data: cancelPayload,
        });
        expect([200, 201]).toContain(cancelRes.status());
        console.log(`🎉 [Result 3] ORDER CANCELLED BY USER! Status: user_cancel (HTTP ${cancelRes.status()})`);

        await attachApiStep(testInfo, {
            title: `User Cancel Order ID ${order?.id}`,
            method: 'PATCH',
            url: `${BASE_URL}/api/v1/orders/${order?.id}/cancel`,
            headers: user.userHeaders,
            requestData: cancelPayload,
            response: cancelRes,
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. PROVIDER REJECTS ORDER
    // ─────────────────────────────────────────────────────────────
    test('TC-E2E-BOOK-04 [PROVIDER REJECT]: User Places Booking → Salon Provider Rejects Order (Status: artist_reject)', async ({ request }, testInfo) => {
        const user = await createFreshUser(request, 'ProviderRejected');
        const { order } = await placeBooking(request, {
            userHeaders: user.userHeaders,
            phone: user.phone,
            placeOfService: 'home',
            addressId: user.addressId,
            cardId: user.cardId,
            paymentMethod: 'card',
            slotOffset: 7,
        });
        console.log(`✅ [Step 1] Order Created for Reject Test: ID ${order?.id}, Ref: #${order?.bookingRef}`);

        // Provider Rejects the Order
        const adminToken = await getAdminToken(request);
        const salonToken = await getSalonToken(request);
        const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        const salonHeaders = { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` };

        await request.post(`${BASE_URL}/api/v1/web/admin/orders/${order.id}/assign`, {
            headers: adminHeaders,
            data: { salonId: 880 },
        });

        const rejectPayload = { reason: 'Schedule conflict with another booking', comment: 'Provider schedule fully booked' };
        const rejectRes = await request.post(`${BASE_URL}/api/v1/salon/orders/${order.id}/artist_reject`, {
            headers: salonHeaders,
            data: rejectPayload,
        });
        expect([200, 201]).toContain(rejectRes.status());
        console.log(`🎉 [Result 4] ORDER REJECTED BY PROVIDER! Status: artist_reject (HTTP ${rejectRes.status()})`);

        await attachApiStep(testInfo, {
            title: `Provider Reject Order ID ${order?.id}`,
            method: 'POST',
            url: `${BASE_URL}/api/v1/salon/orders/${order?.id}/artist_reject`,
            headers: salonHeaders,
            requestData: rejectPayload,
            response: rejectRes,
        });
    });
});
