// ============================================
// Shared Auth Helper - MyCoifeur API Tests
// ============================================
// Provides reusable login functions and common
// headers for all test files.
// ============================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://lambda-dev.mycoifeur.com.sa';

const TOKEN_CACHE_PATH = path.join(__dirname, '..', '.token_cache.json');
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes (JWT typically expires in 60 min)

function getCachedToken(key) {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        try {
            const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
            const entry = cache[key];
            if (entry && entry.data && entry.cachedAt) {
                const age = Date.now() - entry.cachedAt;
                if (age < TOKEN_TTL_MS) {
                    return entry.data;
                }
                // Token expired, remove it
                delete cache[key];
                fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2));
            }
        } catch (e) {
            return null;
        }
    }
    return null;
}

function setCachedToken(key, tokenData) {
    let cache = {};
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        try {
            cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
        } catch (e) {
            cache = {};
        }
    }
    cache[key] = { data: tokenData, cachedAt: Date.now() };
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2));
}

// ---------- Test Credentials ----------

const ADMIN_CREDENTIALS = {
    user: process.env.ADMIN_USER || 'amrmuhamed9@gmail.com',
    password: process.env.ADMIN_PASSWORD || '123456'
};

const USER_CREDENTIALS = {
    user: process.env.TEST_USER_EMAIL || 'testuser1pw@example.com',
    password: process.env.TEST_USER_PASSWORD || 'Password123456',
    phone: process.env.TEST_USER || '123456786',
    code: '1234',
    countryCode: '966',
    typeUser: 'user'
};

const USER2_CREDENTIALS = {
    user: process.env.TEST_USER2_EMAIL || 'testuser2pw@example.com',
    password: process.env.TEST_USER2_PASSWORD || 'Password123456',
    phone: process.env.TEST_USER2 || '123456783',
    code: '1234',
    countryCode: '966',
    typeUser: 'user'
};

const SALON_CREDENTIALS = {
    user: process.env.SALON_USER_EMAIL || 'Besh_18ab@hotmail.com',
    password: process.env.SALON_PASSWORD || 'Password123456',
    phone: process.env.SALON_USER || '966506874002',
    code: '1234',
    countryCode: '966',
    typeUser: 'freelancer'
};

// ---------- Common Headers ----------

const MOBILE_HEADERS = {
    'x-custom-lang': process.env.CUSTOM_LANG || 'en',
    'x-app-version': process.env.APP_VERSION || '1.1.4',
    'x-platform': process.env.PLATFORM || 'android'
};

// ---------- Login Helpers ----------

/**
 * Login as Admin and return the full response data (with caching)
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function adminLogin(request) {
    const cached = getCachedToken('admin');
    if (cached) return cached;

    const response = await request.post(
        `${BASE_URL}/api/v1/auth/admin/login`,
        { data: ADMIN_CREDENTIALS }
    );

    if (response.status() !== 200) {
        throw new Error(`Admin login failed with status ${response.status()}`);
    }

    const json = await response.json();
    setCachedToken('admin', json.data);
    return json.data;
}

/**
 * Login as User using OTP and return the full response data (with caching)
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} [credentials] - Optional custom credentials
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function userLogin(request, credentials = USER_CREDENTIALS) {
    const isUser1 = !credentials.phone || credentials.phone === USER_CREDENTIALS.phone;
    const cacheKey = isUser1 ? 'user1' : 'user2';
    const cached = getCachedToken(cacheKey);
    if (cached) return cached;

    const otpPayload = {
        phone: credentials.phone || USER_CREDENTIALS.phone,
        code: credentials.code || '1234',
        countryCode: credentials.countryCode || '966',
        typeUser: credentials.typeUser || 'user'
    };

    const response = await request.post(
        `${BASE_URL}/api/v1/auth/verify-code`,
        {
            headers: MOBILE_HEADERS,
            data: otpPayload
        }
    );

    if (response.status() !== 200) {
        throw new Error(`User OTP login failed with status ${response.status()}`);
    }

    const json = await response.json();
    setCachedToken(cacheKey, json.data);
    return json.data;
}

/**
 * Login as Salon/Provider using OTP and return the full response data (with caching)
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function salonLogin(request) {
    const cached = getCachedToken('salon');
    if (cached) return cached;

    const response = await request.post(
        `${BASE_URL}/api/v1/auth/verify-code`,
        {
            headers: MOBILE_HEADERS,
            data: {
                phone: SALON_CREDENTIALS.phone,
                code: SALON_CREDENTIALS.code,
                countryCode: SALON_CREDENTIALS.countryCode,
                typeUser: SALON_CREDENTIALS.typeUser
            }
        }
    );

    if (response.status() !== 200) {
        throw new Error(`Salon OTP login failed with status ${response.status()}`);
    }

    const json = await response.json();
    setCachedToken('salon', json.data);
    return json.data;
}

/**
 * Get admin access token only
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<string>}
 */
async function getAdminToken(request) {
    const data = await adminLogin(request);
    return data.accessToken;
}

/**
 * Get user access token only
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<string>}
 */
async function getUserToken(request) {
    const data = await userLogin(request);
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
    getUserToken
};
