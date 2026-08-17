// ============================================
// Shared Auth Helper - MyCoifeur API Tests
// ============================================
// Auth flows:
//   User/Salon: send-otp → verify-code (code: 1234) → get token
//   Admin: email + password login
// Phone format: 966 + 9 digits (e.g. 966512345678)
// ============================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://zk2a6jfr01.execute-api.ap-southeast-5.amazonaws.com';

const TOKEN_CACHE_PATH = path.join(__dirname, '..', '.token_cache.json');
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes

function getCachedToken(key) {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        try {
            const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
            const entry = cache[key];
            if (entry && entry.data && entry.cachedAt) {
                const age = Date.now() - entry.cachedAt;
                if (age < TOKEN_TTL_MS) return entry.data;
                delete cache[key];
                fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2));
            }
        } catch (e) { return null; }
    }
    return null;
}

function setCachedToken(key, tokenData) {
    let cache = {};
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        try { cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8')); }
        catch (e) { cache = {}; }
    }
    cache[key] = { data: tokenData, cachedAt: Date.now() };
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2));
}

// ---------- Test Credentials ----------

const ADMIN_CREDENTIALS = {
    user: process.env.ADMIN_USER || 'amrmuhamed9@gmail.com',
    password: process.env.ADMIN_PASSWORD || '123456'
};

// Existing test users (must already be registered in the dev DB)
const USER_CREDENTIALS = {
    phone: process.env.TEST_USER_PHONE || '966512345678',
    countryCode: '966',
    typeUser: 'user',
    code: '1234',
};

const USER2_CREDENTIALS = {
    phone: process.env.TEST_USER2_PHONE || '966512345679',
    countryCode: '966',
    typeUser: 'user',
    code: '1234',
};

const SALON_CREDENTIALS = {
    phone: process.env.SALON_USER_PHONE || '966506874002',
    countryCode: '966',
    typeUser: 'company',
    code: '1234',
};

// ---------- Common Headers ----------
// IMPORTANT: x-app-version must be 1.1.9 to avoid 426 force-update error

const MOBILE_HEADERS = {
    'x-custom-lang': process.env.CUSTOM_LANG || 'en',
    'x-app-version': process.env.APP_VERSION || '1.1.9',
    'x-platform': process.env.PLATFORM || 'android',
};

// ---------- Auth Helpers ----------

/**
 * Login as Admin (email + password) and cache the token.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function adminLogin(request) {
    const cached = getCachedToken('admin');
    if (cached) return cached;

    const response = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, {
        headers: { 'x-custom-lang': 'en' },
        data: ADMIN_CREDENTIALS
    });

    if (response.status() !== 200) {
        const body = await response.text();
        throw new Error(`Admin login failed: ${response.status()} — ${body}`);
    }

    const json = await response.json();
    const tokenData = json.data || json;
    setCachedToken('admin', tokenData);
    return tokenData;
}

/**
 * Login as User via send-otp → verify-code flow and cache the token.
 * Phone format: 966 + 9 digits. OTP bypass: 1234.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} [creds] - Optional custom credentials
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function userLogin(request, creds = USER_CREDENTIALS) {
    const cacheKey = `user_${creds.phone}`;
    const cached = getCachedToken(cacheKey);
    if (cached) return cached;

    // Step 1: send-otp
    const sendOtpRes = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
        headers: MOBILE_HEADERS,
        data: {
            phone: creds.phone,
            countryCode: creds.countryCode || '966',
            typeUser: creds.typeUser || 'user',
        }
    });

    if (sendOtpRes.status() !== 200 && sendOtpRes.status() !== 429) {
        const body = await sendOtpRes.text();
        throw new Error(`send-otp failed: ${sendOtpRes.status()} — ${body}`);
    }

    // Step 2: verify-code (bypass OTP 1234)
    const verifyRes = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, {
        headers: MOBILE_HEADERS,
        data: {
            phone: creds.phone,
            code: creds.code || '1234',
            typeUser: creds.typeUser || 'user',
            countryCode: creds.countryCode || '966',
        }
    });

    if (verifyRes.status() !== 200) {
        const body = await verifyRes.text();
        throw new Error(`verify-code failed: ${verifyRes.status()} — ${body}`);
    }

    const json = await verifyRes.json();
    const tokenData = json.data || json;
    setCachedToken(cacheKey, tokenData);
    return tokenData;
}

/**
 * Login as Salon/Provider via send-otp → verify-code flow.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} [creds] - Optional custom credentials
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function salonLogin(request, creds = SALON_CREDENTIALS) {
    return userLogin(request, { ...creds, typeUser: creds.typeUser || 'company' });
}

/**
 * Get admin access token only.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<string>}
 */
async function getAdminToken(request) {
    const data = await adminLogin(request);
    return data.accessToken;
}

/**
 * Get user access token only.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} [creds] - Optional custom credentials
 * @returns {Promise<string>}
 */
async function getUserToken(request, creds) {
    const data = await userLogin(request, creds);
    return data.accessToken;
}

/**
 * Get salon access token only.
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<string>}
 */
async function getSalonToken(request) {
    const data = await salonLogin(request);
    return data.accessToken;
}

module.exports = {
    BASE_URL,
    ADMIN_CREDENTIALS,
    USER_CREDENTIALS,
    USER2_CREDENTIALS,
    SALON_CREDENTIALS,
    MOBILE_HEADERS,
    adminLogin,
    userLogin,
    salonLogin,
    getAdminToken,
    getUserToken,
    getSalonToken,
};
