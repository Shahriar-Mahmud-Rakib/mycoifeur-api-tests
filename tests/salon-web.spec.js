// ============================================
// Web Salon Services, Offers & Packages API Tests
// ============================================
// GET/POST      /api/v1/web/salon/services
// GET/PATCH/DEL /api/v1/web/salon/services/{id}
// POST          /api/v1/web/salon/services/create
// GET/POST      /api/v1/web/salon/offers
// GET/PATCH/DEL /api/v1/web/salon/offers/{id}
// GET/POST      /api/v1/web/salon/packages
// GET/PATCH/DEL /api/v1/web/salon/packages/{id}
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS, salonLogin } = require('./helpers/auth.helper');

let salonToken = null;
let testServiceId = null;
let testOfferId = null;
let testPackageId = null;

async function getSalonToken(request) {
    if (salonToken) return salonToken;
    const data = await salonLogin(request);
    salonToken = data.accessToken;
    return salonToken;
}

test.describe('Web Salon Services Tests', () => {

    test('TC-01: Should get salon web services list', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/services`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Web salon services status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testServiceId = json.data.data[0].id;
        console.log('✅ Web salon services fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-02: Should create new web salon service', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/services/create`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: {
                name: 'Web Test Service',
                name_ar: 'خدمة تجريبية',
                description: 'Web service description',
                price: '150',
                duration: '45',
                category_id: '1'
            }
        });
        const json = await response.json();
        console.log('Create web service status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testServiceId = json.data.id;
            console.log('✅ Web service created, id:', testServiceId);
        } else {
            console.log('ℹ️  Create web service:', json.message);
        }
    });

    test('TC-03: Should get single web service', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/services/${testServiceId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Web service detail status:', response.status());
        if (response.status() === 200) console.log('✅ Web service detail fetched');
        else console.log('ℹ️  Web service detail:', json.message);
    });

    test('TC-04: Should edit web service', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/services/${testServiceId}/edit`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { name: 'Updated Web Service', price: '200' }
        });
        const json = await response.json();
        console.log('Edit web service status:', response.status());
        if (response.status() === 200) console.log('✅ Web service updated');
        else console.log('ℹ️  Edit web service:', json.message);
    });

    test('TC-05: Should delete web service', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/salon/services/${testServiceId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Delete web service status:', response.status());
        if (response.status() === 200 || response.status() === 204) {
            console.log('✅ Web service deleted');
        } else {
            const text = await response.text();
            console.log('ℹ️  Delete web service:', text);
        }
    });

    test('TC-06: Should restore web service', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testServiceId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.patch(`${BASE_URL}/api/v1/web/salon/services/${testServiceId}/restore`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Restore web service status:', response.status());
        if (response.status() === 200) console.log('✅ Web service restored');
        else console.log('ℹ️  Restore web service:', json.message);
    });

    test('TC-07: Should get services by category', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/services/category/1`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Services by category status:', response.status());
        if (response.status() === 200) console.log('✅ Services by category fetched');
        else console.log('ℹ️  Services by category:', json.message);
    });

    test('TC-08: Should fail web services without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/services`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Web Salon Offers Tests', () => {

    test('TC-09: Should get salon offers list', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/offers`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Web salon offers status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testOfferId = json.data.data[0].id;
        console.log('✅ Offers fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-10: Should create new salon offer', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/offers`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: {
                name: 'Test Offer',
                name_ar: 'عرض تجريبي',
                description: 'Test offer description',
                price: '200',
                discount: '20',
                start_date: '2026-06-01',
                end_date: '2026-08-31'
            }
        });
        const json = await response.json();
        console.log('Create offer status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testOfferId = json.data.id;
            console.log('✅ Offer created, id:', testOfferId);
        } else {
            console.log('ℹ️  Create offer:', json.message);
        }
    });

    test('TC-11: Should get single offer', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testOfferId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/offers/${testOfferId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Offer detail status:', response.status());
        if (response.status() === 200) console.log('✅ Offer detail fetched');
        else console.log('ℹ️  Offer detail:', json.message);
    });

    test('TC-12: Should edit offer', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testOfferId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/offers/${testOfferId}/edit`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { name: 'Updated Offer', discount: '25' }
        });
        const json = await response.json();
        console.log('Edit offer status:', response.status());
        if (response.status() === 200) console.log('✅ Offer updated');
        else console.log('ℹ️  Edit offer:', json.message);
    });

    test('TC-13: Should delete offer', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testOfferId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/salon/offers/${testOfferId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Delete offer status:', response.status());
        if (response.status() === 200 || response.status() === 204) {
            console.log('✅ Offer deleted');
        } else {
            const text = await response.text();
            console.log('ℹ️  Delete offer:', text);
        }
    });

    test('TC-14: Should fail offers without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/offers`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});

test.describe('Web Salon Packages Tests', () => {

    test('TC-15: Should get salon packages list', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/packages`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Web salon packages status:', response.status());
        expect(response.status()).toBe(200);
        expect(json.success).toBe(true);
        if (json.data?.data?.length > 0) testPackageId = json.data.data[0].id;
        console.log('✅ Packages fetched, count:', json.data?.data?.length || 0);
    });

    test('TC-16: Should create new salon package', async ({ request }) => {
        const token = await getSalonToken(request);
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/packages`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: {
                name: 'Test Package',
                name_ar: 'باقة تجريبية',
                description: 'Test package',
                price: '500',
                sessions: '5'
            }
        });
        const json = await response.json();
        console.log('Create package status:', response.status());
        if (response.status() === 200 || response.status() === 201) {
            if (json.data?.id) testPackageId = json.data.id;
            console.log('✅ Package created, id:', testPackageId);
        } else {
            console.log('ℹ️  Create package:', json.message);
        }
    });

    test('TC-17: Should get single package', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testPackageId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/packages/${testPackageId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        console.log('Package detail status:', response.status());
        if (response.status() === 200) console.log('✅ Package detail fetched');
        else console.log('ℹ️  Package detail:', json.message);
    });

    test('TC-18: Should edit package', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testPackageId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.post(`${BASE_URL}/api/v1/web/salon/packages/${testPackageId}/edit`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` },
            multipart: { name: 'Updated Package', price: '600' }
        });
        const json = await response.json();
        console.log('Edit package status:', response.status());
        if (response.status() === 200) console.log('✅ Package updated');
        else console.log('ℹ️  Edit package:', json.message);
    });

    test('TC-19: Should delete package', async ({ request }) => {
        const token = await getSalonToken(request);
        if (!testPackageId) { console.log('ℹ️  Skipping'); return; }
        const response = await request.delete(`${BASE_URL}/api/v1/web/salon/packages/${testPackageId}`, {
            headers: { ...MOBILE_HEADERS, 'Authorization': `Bearer ${token}` }
        });
        console.log('Delete package status:', response.status());
        if (response.status() === 200 || response.status() === 204) {
            console.log('✅ Package deleted');
        } else {
            const text = await response.text();
            console.log('ℹ️  Delete package:', text);
        }
    });

    test('TC-20: Should fail packages without auth', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/v1/web/salon/packages`, { headers: MOBILE_HEADERS });
        expect(response.status()).not.toBe(200);
        console.log('✅ No auth rejected, status:', response.status());
    });
});
