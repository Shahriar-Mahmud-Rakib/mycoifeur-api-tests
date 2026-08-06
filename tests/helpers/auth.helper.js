// ============================================
// Shared Auth Helper - MyCoifeur API Tests
// ============================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://lambda-dev.mycoifeur.com.sa';

const TOKEN_CACHE_PATH = path.join(__dirname, '..', '.token_cache.json');

function getCachedToken(key) {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        try {
            const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
            return cache[key];
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
    cache[key] = tokenData;
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2));
}

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

const MOBILE_HEADERS = {
    'x-custom-lang': process.env.CUSTOM_LANG || 'en',
    'x-app-version': process.env.APP_VERSION || '1.1.4',
    'x-platform': process.env.PLATFORM || 'android'
};

async function adminLogin(request) {
    const cached = getCachedToken('admin');
    if (cached) return cached;

    const response = await request.post(`${BASE_URL}/api/v1/auth/admin/login`, { data: ADMIN_CREDENTIALS });
    if (response.status() !== 200) throw new Error(`Admin login failed with status ${response.status()}`);
    const json = await response.json();
    setCachedToken('admin', json.data);
    return json.data;
}

async function userLogin(request, credentials = USER_CREDENTIALS) {
    const cacheKey = credentials.phone === USER_CREDENTIALS.phone ? 'user1' : 'user2';
    const cached = getCachedToken(cacheKey);
    if (cached) return cached;

    const response = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, { headers: MOBILE_HEADERS, data: credentials });
    if (response.status() !== 200) throw new Error(`User OTP login failed with status ${response.status()}`);
    const json = await response.json();
    setCachedToken(cacheKey, json.data);
    return json.data;
}

async function salonLogin(request) {
    const cached = getCachedToken('salon');
    if (cached) return cached;

    const response = await request.post(`${BASE_URL}/api/v1/auth/verify-code`, { headers: MOBILE_HEADERS, data: SALON_CREDENTIALS });
    if (response.status() !== 200) throw new Error(`Salon OTP login failed with status ${response.status()}`);
    const json = await response.json();
    setCachedToken('salon', json.data);
    return json.data;
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
    salonLogin
};
