// ============================================
// Data Lifecycle Helper - MyCoifeur API Tests
// ============================================
// Creates and deletes test entities via API calls.
// Flow:
//   1. send-otp → 200
//   2. verify-code (code: 1234) → 200 + accessToken + user object
//   3. user profile update (optional)
//   4. Teardown: admin DELETE /{id}
// Phone format: 966 + 9 random digits
// ============================================

const { expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./auth.helper');

function generatePhone() {
    // 966 + 9 random digits
    const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `966${digits}`;
}

// ------------------------------------------------------------------
// USER
// ------------------------------------------------------------------

async function createTestUser(request, overrides = {}) {
    const ts = Date.now().toString().slice(-7);
    const phone = overrides.phone || generatePhone();
    const payload = {
        email: `auto_user_${ts}@testmail.com`,
        password: 'Password123456',
        fname: 'AutoTest',
        lname: 'User',
        phone,
        typeUser: 'user',
        countryCode: '966',
        ...overrides,
    };

    // Step 1: send-otp
    const sendRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: { phone, countryCode: '966', typeUser: 'user' }
    });
    if (![200, 201, 429].includes(sendRes.status())) {
        const body = await sendRes.text();
        throw new Error(`send-otp failed: ${sendRes.status()} — ${body}`);
    }

    // Step 2: verify-code → get token
    const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
        headers: MOBILE_HEADERS,
        data: { phone, code: '1234', typeUser: 'user', countryCode: '966' }
    });
    if (verifyRes.status() !== 200) {
        const body = await verifyRes.text();
        throw new Error(`verify-code failed: ${verifyRes.status()} — ${body}`);
    }
    const verifyJson = await verifyRes.json();
    const accessToken = verifyJson.data?.accessToken;
    const userId = verifyJson.data?.user?.id;

    // Step 3: Complete profile name/email if token available
    if (accessToken) {
        await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${accessToken}` },
            data: { firstName: payload.fname, lastName: payload.lname, email: payload.email }
        });
    }

    return { payload, id: userId, accessToken };
}

async function deleteTestUser(request, userId) {
    if (!userId) return;
    const adminToken = await getAdminToken(request);
    const res = await request.delete(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
    });
    if (res.status() !== 404) {
        expect(res.status()).toBe(200);
    }
}

// ------------------------------------------------------------------
// SALON
// ------------------------------------------------------------------

async function createTestSalon(request, overrides = {}) {
    const ts = Date.now().toString().slice(-7);
    const phone = overrides.phone || generatePhone();
    const payload = {
        email: `auto_salon_${ts}@testmail.com`,
        password: 'Password123456',
        fname: 'AutoTest',
        lname: 'Salon',
        phone,
        typeUser: 'company',
        countryCode: '966',
        ...overrides,
    };

    // Step 1: send-otp
    const sendRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: { phone, countryCode: '966', typeUser: 'company' }
    });
    if (![200, 201, 429].includes(sendRes.status())) {
        const body = await sendRes.text();
        throw new Error(`send-otp failed: ${sendRes.status()} — ${body}`);
    }

    // Step 2: verify-code → get token
    const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
        headers: MOBILE_HEADERS,
        data: { phone, code: '1234', typeUser: 'company', countryCode: '966' }
    });
    if (verifyRes.status() !== 200) {
        const body = await verifyRes.text();
        throw new Error(`verify-code failed: ${verifyRes.status()} — ${body}`);
    }
    const verifyJson = await verifyRes.json();
    const accessToken = verifyJson.data?.accessToken;
    const userId = verifyJson.data?.user?.id;

    // Step 3: Admin activate salon
    if (userId) {
        const adminToken = await getAdminToken(request);
        await request.put(`${BASE_URL}/api/v1/web/admin/salons/${userId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { status: 'show', is_active: '1', is_verified: '1' }
        });
    }

    return { payload, id: userId, accessToken };
}

async function deleteTestSalon(request, userId) {
    if (!userId) return;
    const adminToken = await getAdminToken(request);
    const res = await request.delete(`${BASE_URL}/api/v1/web/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
    });
    if (res.status() !== 404) {
        expect(res.status()).toBe(200);
    }
}

module.exports = {
    generatePhone,
    createTestUser,
    deleteTestUser,
    createTestSalon,
    deleteTestSalon,
};
