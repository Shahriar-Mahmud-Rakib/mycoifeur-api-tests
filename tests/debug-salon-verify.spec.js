const { test, expect } = require('@playwright/test');
const { BASE_URL, getAdminToken } = require('./helpers/auth.helper');

test('Check Salon Verify Field', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    console.log('Got admin token');

    const salonId = 1530; // Salon from our previous test
    const res = await request.get(`${BASE_URL}/api/v1/web/admin/salons/${salonId}`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'x-custom-lang': 'en'
        }
    });

    const json = await res.json();
    console.log('Salon Data Keys:', Object.keys(json.data));
    console.log('Salon verify fields:', {
        is_verified: json.data.is_verified,
        isVerified: json.data.isVerified,
        status: json.data.status,
        isActive: json.data.isActive,
        is_active: json.data.is_active
    });
});
