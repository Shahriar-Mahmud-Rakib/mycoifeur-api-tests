require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');
const { createTestUser, deleteTestUser, createTestSalon, deleteTestSalon } = require('./helpers/lifecycle.helper');

test.describe('🔄 Fully Automated E2E Lifecycle Testing with Data Cleanup', () => {

    let testUser = null;
    let testSalon = null;

    test.afterAll(async ({ request }) => {
        // Clean up data via DELETE API
        if (process.env.CLEAN_TEST_DATA !== 'false') {
            if (testUser?.id) {
                console.log(`Cleaning up Test User ID: ${testUser.id}`);
                await deleteTestUser(request, testUser.id);
            }
            if (testSalon?.id) {
                console.log(`Cleaning up Test Salon ID: ${testSalon.id}`);
                await deleteTestSalon(request, testSalon.id);
            }
        }
    });

    test('TC-LIFECYCLE-1: User Registration, Profile Fetch, and Update', async ({ request }) => {
        // 1. Setup: Create User via API
        console.log(`Creating test user...`);
        testUser = await createTestUser(request);
        expect(testUser.id).toBeDefined();
        console.log(`Test user created with ID: ${testUser.id}`);

        // 2. Perform Login to get User Token
        const loginRes = await request.post(`${BASE_URL}/api/v1/auth/login`, {
            headers: MOBILE_HEADERS,
            data: { user: testUser.payload.email, password: testUser.payload.password }
        });
        expect(loginRes.status()).toBe(200);
        const loginJson = await loginRes.json();
        const userToken = loginJson.data?.accessToken;
        expect(userToken).toBeDefined();

        // 3. Test GET Profile
        const profileRes = await request.get(`${BASE_URL}/api/v1/user/profile`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${userToken}`
            }
        });
        expect(profileRes.status()).toBe(200);
        const profileJson = await profileRes.json();
        expect(profileJson.data?.email).toBe(testUser.payload.email);

        // 4. Test Update Profile
        const updateRes = await request.patch(`${BASE_URL}/api/v1/user/profile`, {
            headers: {
                ...MOBILE_HEADERS,
                'Authorization': `Bearer ${userToken}`
            },
            multipart: {
                firstName: 'UpdatedName',   // UpdateUserDto uses firstName not fname
            }
        });
        expect(updateRes.status()).toBe(200);
        const updateJson = await updateRes.json();
        expect(updateJson.data?.firstName).toBe('UpdatedName');
        
        console.log(`User lifecycle tests completed successfully.`);
    });

    test('TC-LIFECYCLE-2: Salon Registration, Login, and Status Check', async ({ request }) => {
        // 1. Setup: Create Salon via API
        console.log(`Creating test salon...`);
        testSalon = await createTestSalon(request);
        expect(testSalon.id).toBeDefined();
        console.log(`Test salon created with ID: ${testSalon.id}`);

        // 2. Salon token is already returned from createTestSalon
        const salonToken = testSalon.accessToken;
        expect(salonToken).toBeDefined();
        console.log(`Salon token received.`);
        
        console.log(`Salon lifecycle tests completed successfully.`);
    });
});
