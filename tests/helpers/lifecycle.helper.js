// ============================================
// Data Lifecycle Helper - MyCoifeur API Tests
// ============================================
// Creates and deletes test entities via API calls.
// Flow:
//   1. Register user/salon → 200 (account created)
//   2. send-otp → 200
//   3. verify-code (code: 1234) → 200 + accessToken
//   4. Use admin token to find the created user/salon ID
//   5. Teardown: admin DELETE /{id}
// Phone format: 966 + 9 random digits
// ============================================

const { expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken } = require('./auth.helper');

function generatePhone() {
    // 966 + 9 random digits
    const digits = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    return `966${digits}`;
}

// ------------------------------------------------------------------
// USER
// ------------------------------------------------------------------

async function createTestUser(request, overrides = {}) {
    const ts = Date.now().toString();
    const phone = overrides.phone || generatePhone();
    const payload = {
        email: `auto_user_${ts}@testmail.com`,
        password: 'Password123456',
        fname: 'AutoTest',
        lname: 'User',
        phone,
        type_user: 'user',
        country_id: '1',
        city_id: '1',
        ...overrides,
    };

    // Step 1: Register
    const regRes = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
        headers: MOBILE_HEADERS,
        multipart: payload,
    });
    if (![200, 201].includes(regRes.status())) {
        const body = await regRes.text();
        throw new Error(`Register user failed: ${regRes.status()} — ${body}`);
    }

    // Step 2: send-otp
    const sendRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: { phone, countryCode: '966', typeUser: 'user' }
    });
    if (sendRes.status() !== 200 && sendRes.status() !== 429) {
        const body = await sendRes.text();
        throw new Error(`send-otp failed: ${sendRes.status()} — ${body}`);
    }

    // Step 3: verify-code → get token
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

    // Step 4: Fetch user ID via admin search endpoint
    const adminToken = await getAdminToken(request);
    const listRes = await request.get(`${BASE_URL}/api/v1/web/admin/users/search?query=${encodeURIComponent(payload.email)}`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
    });
    const listJson = await listRes.json();
    const found = listJson.data?.find(u => u.email === payload.email) || listJson.data?.[0];

    return { payload, id: found?.id, accessToken };
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
    const ts = Date.now().toString();
    const phone = overrides.phone || generatePhone();
    const payload = {
        email: `auto_salon_${ts}@testmail.com`,
        password: 'Password123456',
        fname: 'AutoTest',
        lname: 'Salon',
        phone,
        type_user: 'company',
        country_id: '1',
        city_id: '1',
        ...overrides,
    };

    // Step 1: Register
    const regRes = await request.post(`${BASE_URL}/api/v1/auth/user/register`, {
        headers: MOBILE_HEADERS,
        multipart: payload,
    });
    if (![200, 201].includes(regRes.status())) {
        const body = await regRes.text();
        throw new Error(`Register salon failed: ${regRes.status()} — ${body}`);
    }

    // Step 2: send-otp
    const sendRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: { phone, countryCode: '966', typeUser: 'company' }
    });
    if (sendRes.status() !== 200 && sendRes.status() !== 429) {
        const body = await sendRes.text();
        throw new Error(`send-otp failed: ${sendRes.status()} — ${body}`);
    }

    // Step 3: verify-code → get token
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

    // Step 4: Find salon ID via admin search endpoint
    const adminToken = await getAdminToken(request);
    const listRes = await request.get(`${BASE_URL}/api/v1/web/admin/users/search?query=${encodeURIComponent(payload.email)}`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
    });
    const listJson = await listRes.json();
    const found = listJson.data?.find(u => u.email === payload.email) || listJson.data?.[0];

    return { payload, id: found?.id, accessToken };
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
