// ============================================
// Full Suite: Content - Blogs, Pages, FAQs, Privacy Policy, Contact Us (Exhaustive DDT)
// Lifecycle: create → test → delete
// ============================================
require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, getAdminToken, getUserToken } = require('../helpers/auth.helper');
const { createTestUser, deleteTestUser } = require('../helpers/lifecycle.helper');
const { validationPayloads, securityPayloads, invalidAuthHeaders } = require('../helpers/payloads.helper');

test.describe('📝 Content Management (Blogs, Pages, FAQs, Privacy Policy)', () => {

    let adminToken, userToken, testUser;
    let blogId, pageId, faqId, privacyId;

    test.beforeAll(async ({ request }) => {
        adminToken = await getAdminToken(request);
        testUser = await createTestUser(request);
        userToken = testUser.accessToken;
    });

    test.afterAll(async ({ request }) => {
        const H = { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' };
        if (blogId)    await request.delete(`${BASE_URL}/api/v1/admin/blogs/${blogId}`, { headers: H });
        if (pageId)    await request.delete(`${BASE_URL}/api/v1/admin/pages/${pageId}`, { headers: H });
        if (faqId)     await request.delete(`${BASE_URL}/api/v1/admin/faqs/${faqId}`, { headers: H });
        if (privacyId) await request.delete(`${BASE_URL}/api/v1/admin/privacy/${privacyId}`, { headers: H });
        await deleteTestUser(request, testUser?.id);
    });

    // ---- Blogs ----
    test('TC-BLOG-01: Admin create blog post', async ({ request }) => {
        const ts = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/admin/blogs`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                title_ar: 'مدونة اختبار', title_en: `Test Blog ${ts}`,
                url: `test-blog-${ts}`, meta_tags: 'test,blog',
                content_ar: 'محتوى المدونة', content_en: 'Blog content for testing',
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json();
        blogId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(validationPayloads)) {
        test(`TC-BLOG-CREATE-VAL-${key}: Admin create blog post invalid title (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/admin/blogs`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    title_en: payload.val !== undefined && payload.val !== null ? payload.val.toString() : '',
                    title_ar: 'مدونة اختبار', url: `test-blog-${Date.now()}`,
                    meta_tags: 'test,blog',
                    content_ar: 'محتوى المدونة', content_en: 'Blog content',
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-BLOG-CREATE-SEC-${key}: Admin create blog post SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/admin/blogs`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    title_en: typeof payload.val === 'string' ? payload.val : `Test Blog ${Date.now()}`,
                    content_en: typeof payload.val === 'string' ? payload.val : 'Content',
                    meta_tags: 'test,blog',
                    title_ar: 'مدونة اختبار', url: `test-blog-${Date.now()}`, content_ar: 'محتوى المدونة'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-BLOG-02: Admin list all blogs', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/blogs`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    for (const auth of invalidAuthHeaders) {
        test(`TC-BLOG-RBAC-01: Admin list blogs with ${auth.name} → 401/403`, async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/v1/admin/blogs?page=1&limit=10`, { headers: auth.headers });
            expect([401, 403]).toContain(res.status());
        });
    }

    test('TC-BLOG-03: Admin get single blog by ID', async ({ request }) => {
        const targetId = blogId || 1;
        const res = await request.get(`${BASE_URL}/api/v1/admin/blogs/${targetId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200, 404]).toContain(res.status());
    });

    test('TC-BLOG-04: Admin update blog', async ({ request }) => {
        const targetId = blogId || 1;
        const res = await request.put(`${BASE_URL}/api/v1/admin/blogs/${targetId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { title_en: 'Updated Blog Title' }
        });
        expect([200, 400, 404]).toContain(res.status());
    });

    test('TC-BLOG-05: Public blog list (mobile)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/blogs`, { headers: MOBILE_HEADERS });
        expect([200]).toContain(res.status());
    });

    test('TC-BLOG-06: Create blog missing required fields → 400', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/admin/blogs`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { title_en: 'Incomplete Blog' } // missing required fields
        });
        expect([400, 422]).toContain(res.status());
    });

    // ---- Pages ----
    test('TC-PAGE-01: Admin create page', async ({ request }) => {
        const ts = Date.now();
        const res = await request.post(`${BASE_URL}/api/v1/admin/pages`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                titleAr: 'صفحة اختبار', titleEn: `Test Page ${ts}`,
                url: `test-page-${ts}`, contentAr: 'محتوى الصفحة', contentEn: 'Page content'
            }
        });
        expect([200, 201, 400, 422]).toContain(res.status());
        const json = await res.json();
        pageId = json.data?.id || json.id;
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-PAGE-CREATE-SEC-${key}: Admin create page SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/admin/pages`, {
                headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
                data: {
                    titleEn: typeof payload.val === 'string' ? payload.val : `Page_${Date.now()}`,
                    titleAr: 'صفحة', url: `test-page-sec-${Date.now()}`, contentAr: 'محتوى', contentEn: 'Content'
                }
            });
            expect([200, 201, 400, 422, 500]).toContain(res.status());
        });
    }

    test('TC-PAGE-02: Admin list pages', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/pages?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-PAGE-03: Admin update page', async ({ request }) => {
        if (!pageId) { test.skip(); return; }
        const res = await request.put(`${BASE_URL}/api/v1/admin/pages/${pageId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { titleEn: 'Updated Page Title', titleAr: 'عنوان محدث' }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-PAGE-04: Public get page (mobile)', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/pages`, { headers: MOBILE_HEADERS });
        expect([200, 404]).toContain(res.status());
    });

    // ---- FAQs ----
    test('TC-FAQ-01: Admin create FAQ', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/admin/faqs`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: {
                questionEn: 'How do I book?', questionAr: 'كيف أحجز؟',
                answerEn: 'Open the app and browse.', answerAr: 'افتح التطبيق وتصفح.',
                status: 'active', type: 'user'
            }
        });
        expect([200, 201, 422]).toContain(res.status());
        const json = await res.json();
        faqId = json.data?.id || json.id;
    });

    test('TC-FAQ-02: Admin list FAQs', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/faqs?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-FAQ-03: Admin update FAQ', async ({ request }) => {
        if (!faqId) { test.skip(); return; }
        const res = await request.put(`${BASE_URL}/api/v1/admin/faqs/${faqId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' },
            data: { questionEn: 'Updated question?', questionAr: 'سؤال محدث؟' }
        });
        expect([200]).toContain(res.status());
    });

    test('TC-FAQ-04: Public FAQ list', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/faqs`, { headers: MOBILE_HEADERS });
        expect([200]).toContain(res.status());
    });

    // ---- Privacy Policy ----
    test('TC-PRIVACY-01: Admin list privacy policies', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/privacy?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect(res.status()).toBe(200);
    });

    test('TC-PRIVACY-02: Mobile get privacy policy', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/privacy`, { headers: MOBILE_HEADERS });
        expect([200, 404]).toContain(res.status());
    });

    // ---- Contact Us ----
    test('TC-CONTACT-01: Customer submit contact us', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/v1/contact-us`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
            data: {
                name: 'Test User', subject: 'Test Subject',
                email: 'test@example.com', message: 'This is a test message from automated tests.'
            }
        });
        expect([200, 201, 400, 404, 422]).toContain(res.status());
    });

    for (const [key, payload] of Object.entries(securityPayloads)) {
        test(`TC-CONTACT-SUBMIT-SEC-${key}: Customer submit contact us SQLi/XSS (${payload.desc})`, async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/v1/contact-us`, {
                headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${testUser.accessToken}` },
                data: {
                    name: typeof payload.val === 'string' ? payload.val : 'Inject', 
                    subject: 'Subject', email: 'test@test.com', message: 'Message'
                }
            });
            expect([200, 201, 400, 404, 422, 500]).toContain(res.status());
        });
    }

    test('TC-CONTACT-02: Admin list contact us messages', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/v1/admin/contact_us?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'x-custom-lang': 'en' }
        });
        expect([200]).toContain(res.status());
    });
});
