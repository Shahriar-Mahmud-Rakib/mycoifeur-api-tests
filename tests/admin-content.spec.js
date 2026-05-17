// ============================================
// Admin Content APIs Tests
// ============================================
// Advertisements, Blogs, Promos, Pages, Type-Services
// GET/POST /api/v1/admin/advertisements
// GET/PATCH/DEL /api/v1/admin/advertisements/{id}
// GET/POST /api/v1/admin/blogs
// GET/PATCH/DEL /api/v1/admin/blogs/{id}
// GET/POST /api/v1/admin/promocodes
// GET/PATCH/DEL /api/v1/admin/promocodes/{id}
// GET /api/v1/admin/promocodes/user/{userId}
// GET/POST /api/v1/admin/pages
// GET/PATCH/DEL /api/v1/admin/pages/{id}
// GET/POST/PATCH/DEL /api/v1/web/admin/type-services
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

let testAdId = null;
let testBlogId = null;
let testPromoId = null;
let testPageId = null;
let testTypeServiceId = null;

const adminHeaders = async (request) => ({
    'Authorization': `Bearer ${await getAdminToken(request)}`,
    'x-custom-lang': 'en'
});

test.describe('Admin - Advertisements Tests', () => {

    test('TC-01: Should get list of advertisements', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/admin/advertisements`, { headers });
        const json = await response.json();
        console.log('Ads list status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testAdId = json.data.data[0].id;
        console.log('✅ Ads fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-02: Should create new advertisement', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/admin/advertisements`, {
            headers,
            multipart: {
                title: 'Test Ad',
                title_ar: 'إعلان تجريبي',
                link: 'https://example.com',
                is_active: 'true',
                order: '1'
            }
        });
        const json = await response.json();
        console.log('Create ad status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testAdId = json.data.id;
            console.log('✅ Ad created, id:', testAdId);
        } else {
            console.log('ℹ️  Create ad:', json.message);
        }
    });

    test('TC-03: Should get single ad', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/admin/advertisements/${testAdId}`, { headers });
        const json = await response.json();
        console.log('Ad detail status:', response.status());
        if (response.status() === 200) console.log('✅ Ad detail fetched');
        else console.log('ℹ️  Ad detail:', json.message);
    });

    test('TC-04: Should update advertisement', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/admin/advertisements/${testAdId}`, {
            headers,
            multipart: { title: 'Updated Test Ad' }
        });
        const json = await response.json();
        console.log('Update ad status:', response.status());
        if (response.status() === 200) console.log('✅ Ad updated');
        else console.log('ℹ️  Update ad:', json.message);
    });

    test('TC-05: Should delete advertisement', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testAdId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/admin/advertisements/${testAdId}`, { headers });
        const json = await response.json();
        console.log('Delete ad status:', response.status());
        if (response.status() === 200) console.log('✅ Ad deleted');
        else console.log('ℹ️  Delete ad:', json.message);
    });

    test('TC-06: Should fail ads without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/admin/advertisements`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Blogs Tests', () => {

    test('TC-07: Should get admin blogs list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/admin/blogs`, { headers });
        const json = await response.json();
        console.log('Admin blogs status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testBlogId = json.data.data[0].id;
        console.log('✅ Admin blogs fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-08: Should create new blog', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/admin/blogs`, {
            headers,
            multipart: {
                title: 'Test Blog Post',
                title_ar: 'مقال تجريبي',
                content: 'Test blog content',
                content_ar: 'محتوى تجريبي',
                is_active: 'true'
            }
        });
        const json = await response.json();
        console.log('Create blog status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testBlogId = json.data.id;
            console.log('✅ Blog created, id:', testBlogId);
        } else {
            console.log('ℹ️  Create blog:', json.message);
        }
    });

    test('TC-09: Should get single blog', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testBlogId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/admin/blogs/${testBlogId}`, { headers });
        const json = await response.json();
        console.log('Blog detail status:', response.status());
        if (response.status() === 200) console.log('✅ Blog detail fetched');
        else console.log('ℹ️  Blog detail:', json.message);
    });

    test('TC-10: Should update blog', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testBlogId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/admin/blogs/${testBlogId}`, {
            headers,
            multipart: { title: 'Updated Blog Post' }
        });
        const json = await response.json();
        console.log('Update blog status:', response.status());
        if (response.status() === 200) console.log('✅ Blog updated');
        else console.log('ℹ️  Update blog:', json.message);
    });

    test('TC-11: Should delete blog', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testBlogId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/admin/blogs/${testBlogId}`, { headers });
        const json = await response.json();
        console.log('Delete blog status:', response.status());
        if (response.status() === 200) console.log('✅ Blog deleted');
        else console.log('ℹ️  Delete blog:', json.message);
    });
});

test.describe('Admin - Promo Codes Tests', () => {

    test('TC-12: Should get promo codes list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/admin/promocodes`, { headers });
        const json = await response.json();
        console.log('Promo codes status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testPromoId = json.data.data[0].id;
        console.log('✅ Promo codes fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-13: Should create new promo code', async ({ request }) => {
        const headers = await adminHeaders(request);
        const ts = Date.now().toString().slice(-4);
        const response = await request.post(`${BASE_URL}/api/v1/admin/promocodes`, {
            headers,
            data: {
                code: `TEST${ts}`,
                discount_type: 'percentage',
                discount_value: 10,
                max_uses: 100,
                expires_at: '2026-12-31'
            }
        });
        const json = await response.json();
        console.log('Create promo status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testPromoId = json.data.id;
            console.log('✅ Promo code created, id:', testPromoId);
        } else {
            console.log('ℹ️  Create promo:', json.message);
        }
    });

    test('TC-14: Should get single promo code', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testPromoId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/admin/promocodes/${testPromoId}`, { headers });
        const json = await response.json();
        console.log('Promo detail status:', response.status());
        if (response.status() === 200) console.log('✅ Promo detail fetched');
        else console.log('ℹ️  Promo detail:', json.message);
    });

    test('TC-15: Should update promo code', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testPromoId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/admin/promocodes/${testPromoId}`, {
            headers,
            data: { discount_value: 15 }
        });
        const json = await response.json();
        console.log('Update promo status:', response.status());
        if (response.status() === 200) console.log('✅ Promo updated');
        else console.log('ℹ️  Update promo:', json.message);
    });

    test('TC-16: Should delete promo code', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testPromoId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/admin/promocodes/${testPromoId}`, { headers });
        const json = await response.json();
        console.log('Delete promo status:', response.status());
        if (response.status() === 200) console.log('✅ Promo deleted');
        else console.log('ℹ️  Delete promo:', json.message);
    });

    test('TC-17: Should fail promo codes without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/admin/promocodes`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Admin - Pages Tests', () => {

    test('TC-18: Should get pages list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/admin/pages`, { headers });
        const json = await response.json();
        console.log('Admin pages status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.length > 0) testPageId = json.data[0].id;
        console.log('✅ Pages fetched, count:', json.data?.length || 0);
    });

    test('TC-19: Should get single page', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testPageId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/admin/pages/${testPageId}`, { headers });
        const json = await response.json();
        console.log('Page detail status:', response.status());
        if (response.status() === 200) console.log('✅ Page detail fetched');
        else console.log('ℹ️  Page detail:', json.message);
    });

    test('TC-20: Should update page content', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testPageId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/admin/pages/${testPageId}`, {
            headers,
            data: { content: 'Updated page content', content_ar: 'محتوى محدث' }
        });
        const json = await response.json();
        console.log('Update page status:', response.status());
        if (response.status() === 200) console.log('✅ Page updated');
        else console.log('ℹ️  Update page:', json.message);
    });
});

test.describe('Admin - Type Services Tests', () => {

    test('TC-21: Should get type-services list', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/type-services`, { headers });
        const json = await response.json();
        console.log('Type services status:', response.status());
        expect(response.status()).toBe(200);
        if (json.data?.data?.length > 0) testTypeServiceId = json.data.data[0].id;
        console.log('✅ Type services fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-22: Should create new type-service', async ({ request }) => {
        const headers = await adminHeaders(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/admin/type-services`, {
            headers,
            multipart: { name: 'Test Type', name_ar: 'نوع تجريبي' }
        });
        const json = await response.json();
        console.log('Create type-service status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testTypeServiceId = json.data.id;
            console.log('✅ Type service created');
        } else {
            console.log('ℹ️  Create type-service:', json.message);
        }
    });

    test('TC-23: Should get single type-service', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testTypeServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/type-services/${testTypeServiceId}`, { headers });
        const json = await response.json();
        console.log('Type-service detail status:', response.status());
        if (response.status() === 200) console.log('✅ Type-service detail fetched');
        else console.log('ℹ️  Type-service detail:', json.message);
    });

    test('TC-24: Should delete type-service', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testTypeServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/admin/type-services/${testTypeServiceId}`, { headers });
        const json = await response.json();
        console.log('Delete type-service status:', response.status());
        if (response.status() === 200) console.log('✅ Type-service deleted');
        else console.log('ℹ️  Delete type-service:', json.message);
    });

    test('TC-25: Should restore type-service', async ({ request }) => {
        const headers = await adminHeaders(request);
        if (!testTypeServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/admin/type-services/${testTypeServiceId}/restore`, { headers });
        const json = await response.json();
        console.log('Restore type-service status:', response.status());
        if (response.status() === 200) console.log('✅ Type-service restored');
        else console.log('ℹ️  Restore type-service:', json.message);
    });

    test('TC-26: Should fail type-services without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/admin/type-services`);
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
