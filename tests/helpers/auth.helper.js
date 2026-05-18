// ============================================
// Shared Auth Helper - MyCoifeur API Tests
// ============================================
// Provides reusable login functions and common
// headers for all test files.
// ============================================

require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'https://dev-api.mycoifeur.com.sa';

// ---------- Test Credentials ----------

const ADMIN_CREDENTIALS = {
    user: process.env.ADMIN_USER || 'amrmuhamed9@gmail.com',
    password: process.env.ADMIN_PASSWORD || '123456'
};

const USER_CREDENTIALS = {
    user: process.env.TEST_USER || 'test19@example.com',
    password: process.env.TEST_USER_PASSWORD || 'Password123456'
};

const USER2_CREDENTIALS = {
    user: process.env.TEST_USER2 || 'test1214@gmail.com',
    password: process.env.TEST_USER2_PASSWORD || 'Password123456'
};

const SALON_CREDENTIALS = {
    user: process.env.SALON_USER || 'aalih.aaa986@gmail.com',
    password: process.env.SALON_PASSWORD || '123456'
};

// ---------- Common Headers ----------

const MOBILE_HEADERS = {
    'x-custom-lang': process.env.CUSTOM_LANG || 'en',
    'x-app-version': process.env.APP_VERSION || '1.1.4',
    'x-platform': process.env.PLATFORM || 'android'
};

// ---------- Login Helpers ----------

/**
 * Login as Admin and return the full response data
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function adminLogin(request) {
    const response = await request.post(
        `${BASE_URL}/api/v1/auth/admin/login`,
        {
            data: ADMIN_CREDENTIALS
        }
    );

    if (response.status() !== 200) {
        throw new Error(`Admin login failed with status ${response.status()}`);
    }

    const json = await response.json();
    return json.data;
}

/**
 * Login as User (email + password) and return the full response data
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {object} [credentials] - Optional custom credentials
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function userLogin(request, credentials = USER_CREDENTIALS) {
    const response = await request.post(
        `${BASE_URL}/api/v1/auth/login`,
        {
            headers: MOBILE_HEADERS,
            data: credentials
        }
    );

    if (response.status() !== 200) {
        throw new Error(`User login failed with status ${response.status()}`);
    }

    const json = await response.json();
    return json.data;
}

/**
 * Login as Salon/Provider and return the full response data
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function salonLogin(request) {
    const response = await request.post(
        `${BASE_URL}/api/v1/auth/admin/login`,
        {
            data: SALON_CREDENTIALS
        }
    );

    if (response.status() !== 200) {
        throw new Error(`Salon login failed with status ${response.status()}`);
    }

    const json = await response.json();
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
