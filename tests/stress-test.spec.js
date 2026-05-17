// ============================================
// API Stress & Load Testing Suite
// ============================================
// Target: /api/v1/config (Public Configuration Endpoint)
// Goal: Validate server behavior under parallel concurrent load
// ============================================

const { test, expect } = require('@playwright/test');
const { BASE_URL, MOBILE_HEADERS } = require('./helpers/auth.helper');

test.describe('API Stress & Load Testing Suite', () => {

    test('TC-STRESS-01: [Load Test] Send 50 concurrent requests simultaneously to measure server resilience', async ({ request }) => {
        const TARGET_ENDPOINT = `${BASE_URL}/api/v1/config/version`;
        const CONCURRENT_REQUESTS = 50; // Dev server benchmark
        
        console.log(`⚡ Initiating Stress Test: Sending ${CONCURRENT_REQUESTS} parallel requests to ${TARGET_ENDPOINT}...`);
        
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
            promises.push(
                request.get(TARGET_ENDPOINT, {
                    headers: MOBILE_HEADERS
                })
                    .then(res => ({
                        status: res.status(),
                        ok: res.ok(),
                        duration: Date.now() - startTime
                    }))
                    .catch(err => ({
                        status: 'Failed/Timeout',
                        ok: false,
                        duration: Date.now() - startTime,
                        error: err.message
                    }))
            );
        }
        
        // Execute all requests concurrently
        const results = await Promise.all(promises);
        const totalDuration = Date.now() - startTime;
        
        // Analyze results
        let passed = 0;
        let failed = 0;
        let rateLimited = 0;
        let serverError = 0;
        let durations = [];
        const uniqueStatuses = new Set();
        
        results.forEach(res => {
            durations.push(res.duration);
            uniqueStatuses.add(res.status);
            if (res.ok) passed++;
            else {
                failed++;
                if (res.status === 429) rateLimited++;
                if (typeof res.status === 'number' && res.status >= 500) serverError++;
            }
        });
        
        const avgResponseTime = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
        
        console.log(`\n📊 --- STRESS TEST REPORT ---`);
        console.log(`   - Total Requests Sent: ${CONCURRENT_REQUESTS}`);
        console.log(`   - Unique Status Codes Returned: ${Array.from(uniqueStatuses).join(', ')}`);
        console.log(`   - Successfully Resolved (2xx): ${passed}`);
        console.log(`   - Failed Requests: ${failed}`);
        console.log(`   - Rate Limited (429): ${rateLimited}`);
        console.log(`   - Server Errors (5xx): ${serverError}`);
        console.log(`   - Total Stress Duration: ${totalDuration} ms`);
        console.log(`   - Avg Response Time: ${avgResponseTime} ms\n`);
        
        // Assert that the server remains stable under load
        // A 429 rate limit is a safe defense, but 5xx means the server crashed
        console.log('🔍 Validating server stability under stress (No 5xx errors permitted)...');
        expect(serverError).toBe(0);
    });
});
