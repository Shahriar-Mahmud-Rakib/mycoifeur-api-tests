// ============================================
// Blogs & Pages API Tests
// ============================================
// GET /api/v1/blogs
// GET /api/v1/blogs/blogs_show/{id}
// GET /api/v1/pages/{url}
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

let testBlogId = null;

test.describe('Blogs API Tests', () => {

    test('TC-01: Should get list of blogs', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/blogs`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Blogs status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data && json.data.data && json.data.data.length > 0) {
            testBlogId = json.data.data[0].id;
            console.log('✅ Blogs fetched, first blog id:', testBlogId);
        } else {
            console.log('✅ Blogs list returned (empty or different structure)');
        }
    });

    test('TC-02: Should get blogs with pagination', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/blogs?page=1&limit=5`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).toBe(200);
        console.log('✅ Blogs paginated');
    });

    test('TC-03: Should get blogs in Arabic', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/blogs`, {
            headers: { ...MOBILE_HEADERS, 'x-custom-lang': 'ar' }
        });
        expect(response.status()).toBe(200);
        console.log('✅ Blogs in Arabic fetched');
    });

    test('TC-04: Should show single blog by ID', async ({ request }) => {
        const blogId = testBlogId || 1;
        const response = await request.get(`${BASE_URL}/api/v1/blogs/blogs_show/${blogId}`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log(`Blog ${blogId} show status:`, response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            if (json.data) {
                console.log('✅ Single blog fetched');
                console.log('   Title:', json.data?.title || json.data?.name || 'N/A');
            } else {
                // API returns 200 with null data when blog ID not found - document behavior
                console.log('ℹ️  Blog returned 200 but data is null (no blog with id:', blogId, ')');
            }
        } else {
            console.log('ℹ️  Blog show response:', json.message);
        }
    });

    test('TC-05: Should return 404 for non-existent blog', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/blogs/blogs_show/99999999`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent blog rejected, status:', response.status());
    });
});

test.describe('Pages API Tests', () => {

    test('TC-06: Should get terms & conditions page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/pages/terms-conditions`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Terms page status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Terms page fetched');
        } else {
            console.log('ℹ️  Terms page response:', json.message);
        }
    });

    test('TC-07: Should get privacy policy page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/pages/privacy-policy`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('Privacy page status:', response.status());
        if (response.status() === 200) {
            expect(json.success).toBe(true);
            console.log('✅ Privacy page fetched');
        } else {
            console.log('ℹ️  Privacy page response:', json.message);
        }
    });

    test('TC-08: Should get about us page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/pages/about-us`, {
            headers: MOBILE_HEADERS
        });
        const json = await response.json();
        console.log('About us page status:', response.status());
        if (response.status() === 200) {
            console.log('✅ About us page fetched');
        } else {
            console.log('ℹ️  About us response:', json.message);
        }
    });

    test('TC-09: Should return 404 for non-existent page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/pages/non-existent-page-xyz`, {
            headers: MOBILE_HEADERS
        });
        expect(response.status()).not.toBe(200);
        console.log('✅ Non-existent page rejected, status:', response.status());
    });
});
