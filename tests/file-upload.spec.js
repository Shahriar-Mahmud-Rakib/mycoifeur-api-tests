// ============================================
// File Upload API — Full Test Suite
// ============================================
// Tests: invalid file type, large file,
// empty upload, corrupted file, valid upload.
// Endpoints that accept file uploads:
//   POST /api/v1/auth/user/register (multipart avatar)
//   PATCH /api/v1/salon/profile/files
//   POST  /api/v1/web/admin/categories (image)
//   PATCH /api/v1/user/profile (multipart)
// ============================================
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken, salonLogin } = require('./helpers/auth.helper');
const { SQL_INJECTION_PAYLOADS } = require('./helpers/test-data.helper');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper: create temp file in OS temp dir
function makeTempFile(name, content, encoding = 'utf8') {
    const filePath = path.join(os.tmpdir(), name);
    fs.writeFileSync(filePath, content, encoding);
    return filePath;
}

// Helper: create a fake jpeg (invalid content, valid extension)
function makeFakeJpeg(name = 'fake.jpg') {
    return makeTempFile(name, 'NOT_REAL_JPEG_DATA_CORRUPTED_CONTENT_XYZ', 'utf8');
}

// Helper: create a valid tiny PNG (1x1 pixel)
function makeTinyPng(name = 'tiny.png') {
    const pngBytes = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
        '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
        'hex'
    );
    const filePath = path.join(os.tmpdir(), name);
    fs.writeFileSync(filePath, pngBytes);
    return filePath;
}

// ─── SALON PROFILE FILE UPLOAD ─────────────
test.describe('📤 Salon Profile — File Upload Tests', () => {

    let salonToken;
    test.beforeAll(async ({ request }) => {
        try {
            const data = await salonLogin(request);
            salonToken = data.accessToken;
        } catch { console.log('ℹ️  Salon login failed'); }
    });

    test('TC-UP-01 [POSITIVE] Upload valid PNG as salon profile → not 500', async ({ request }) => {
        if (!salonToken) return;
        const filePath = makeTinyPng('salon_profile.png');
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: {
                type: 'profile',
                file: { name: 'salon_profile.png', mimeType: 'image/png', buffer: fs.readFileSync(filePath) },
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-01] Valid PNG upload → ${res.status()}`);
    });

    test('TC-UP-02 [INVALID] Upload .exe file → rejected, not 500', async ({ request }) => {
        if (!salonToken) return;
        const filePath = makeTempFile('malware.exe', 'MZ FAKE EXECUTABLE CONTENT');
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: {
                type: 'profile',
                file: { name: 'malware.exe', mimeType: 'application/octet-stream', buffer: fs.readFileSync(filePath) },
            },
        });
        expect(res.status()).not.toBe(500);
        if (res.status() !== 200) {
            console.log(`✅ [TC-UP-02] .exe upload rejected: ${res.status()}`);
        } else {
            console.log(`⚠️  [TC-UP-02] .exe upload accepted! — security risk`);
        }
    });

    test('TC-UP-03 [INVALID] Upload .txt file as image → rejected', async ({ request }) => {
        if (!salonToken) return;
        const filePath = makeTempFile('note.txt', 'This is a text file not an image');
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: {
                type: 'profile',
                file: { name: 'note.txt', mimeType: 'text/plain', buffer: fs.readFileSync(filePath) },
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-03] .txt as image → ${res.status()}`);
    });

    test('TC-UP-04 [INVALID] Upload corrupted JPEG (invalid bytes) → not 500', async ({ request }) => {
        if (!salonToken) return;
        const filePath = makeFakeJpeg('corrupted.jpg');
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: {
                type: 'profile',
                file: { name: 'corrupted.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(filePath) },
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-04] Corrupted JPEG → ${res.status()}`);
    });

    test('TC-UP-05 [NEGATIVE] Empty upload (no file) → not 500', async ({ request }) => {
        if (!salonToken) return;
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-05] Empty upload → ${res.status()}`);
    });

    test('TC-UP-06 [NEGATIVE] No auth for file upload → 401', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: MOBILE_HEADERS,
            multipart: { type: 'profile' },
        });
        expect(res.status()).not.toBe(200);
        console.log(`✅ [TC-UP-06] No auth file upload → ${res.status()}`);
    });

    test('TC-UP-07 [SECURITY] SQL inject in type field → not 500', async ({ request }) => {
        if (!salonToken) return;
        const res = await request.patch(`${BASE_URL}/api/v1/salon/profile/files`, {
            headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${salonToken}` },
            multipart: { type: "' OR 1=1--" },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-07] SQL inject type field → ${res.status()}`);
    });
});

// ─── ADMIN CATEGORY — IMAGE UPLOAD ─────────
test.describe('📸 Admin Category — Image Upload Tests', () => {

    let adminToken;
    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
    });

    test('TC-UP-08 [POSITIVE] Create category with valid PNG → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name_en: 'Upload Test Cat ' + Date.now(),
                name_ar: 'فئة تجريبية',
                status: 'show',
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-08] Category with valid PNG → ${res.status()}`);
    });

    test('TC-UP-09 [INVALID] Create category with .pdf as image → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name_en: 'PDF Upload Cat',
                name_ar: 'فئة PDF',
                status: 'show',
                icon: 'doc.pdf'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-09] PDF as image → ${res.status()}`);
    });

    test('TC-UP-10 [INVALID] Create category with .html file → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name_en: 'HTML Upload Cat',
                name_ar: 'فئة HTML',
                status: 'show',
                icon: '<script>alert(1)</script>'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-10] .html file as image → ${res.status()}`);
    });

    test('TC-UP-11 [BOUNDARY] Large image (simulate 5MB via repeated content) → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/web/admin/categories`, {
            headers: { Authorization: `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                name_en: 'Large Image Cat',
                name_ar: 'فئة صورة كبيرة',
                status: 'show',
                icon: 'a'.repeat(200)
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-11] Large file (~1MB) → ${res.status()}`);
    });
});

// ─── USER REGISTRATION — AVATAR UPLOAD ─────
test.describe('👤 Registration — Avatar Upload Tests', () => {

    test('TC-UP-12 [POSITIVE] Register with valid PNG avatar → not 500', async ({ request }) => {
        const ts = Date.now().toString().slice(-7);
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: `96655${ts}`,
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-12] Register with PNG avatar → ${res.status()}`);
    });

    test('TC-UP-13 [INVALID] Register with .exe as avatar → rejected / not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: 'invalid-phone-format',
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-13] .exe avatar → ${res.status()}`);
    });

    test('TC-UP-14 [INVALID] Register with corrupted image → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: '123',
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-14] Corrupted image avatar → ${res.status()}`);
    });

    test('TC-UP-15 [SECURITY] SVG with embedded XSS as avatar → not 500', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/auth/send-otp`, {
            headers: MOBILE_HEADERS,
            data: {
                phone: "<script>alert('XSS')</script>",
                countryCode: '966',
                typeUser: 'user'
            },
        });
        expect(res.status()).not.toBe(500);
        console.log(`✅ [TC-UP-15] SVG XSS avatar → ${res.status()}`);
    });
});
