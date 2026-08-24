// ============================================
// Allure & Playwright Test Reporter Helper
// Provides rich step attachments for API Tests
// ============================================

/**
 * Log API Request and Response to Allure Test Report
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {Object} options
 * @param {string} options.title - Step / Action Title
 * @param {string} options.method - HTTP Method (GET, POST, PUT, DELETE, etc.)
 * @param {string} options.url - Full Request URL
 * @param {Object} [options.headers] - Request Headers (optional)
 * @param {any} [options.requestData] - Request Body Payload (optional)
 * @param {import('@playwright/test').APIResponse} options.response - Playwright API Response
 */
async function attachApiStep(testInfo, { title, method, url, headers, requestData, response }) {
    if (!testInfo || !response) return;

    const status = response.status();
    let responseBody = null;
    let rawText = '';

    try {
        responseBody = await response.json();
    } catch (e) {
        try {
            rawText = await response.text();
        } catch (err) {
            rawText = '(Unable to read response body)';
        }
    }

    // 1. Attach Request Payload
    const requestDetails = {
        title: title || `${method} ${url}`,
        method,
        url,
        timestamp: new Date().toISOString(),
        headers: headers ? { ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN_TOKEN]' : undefined } : undefined,
        body: requestData !== undefined ? requestData : null,
    };

    await testInfo.attach(`📤 [REQUEST] ${method} ${url}`, {
        body: JSON.stringify(requestDetails, null, 2),
        contentType: 'application/json',
    });

    // 2. Attach Response Body
    const responseDetails = {
        status: status,
        statusText: response.statusText(),
        ok: response.ok(),
        body: responseBody !== null ? responseBody : rawText,
    };

    await testInfo.attach(`📥 [RESPONSE - ${status}] ${method} ${url}`, {
        body: JSON.stringify(responseDetails, null, 2),
        contentType: 'application/json',
    });

    // 3. If error (4xx / 5xx), attach a high-visibility defect note
    if (status >= 400) {
        const errorReason = responseBody?.message || responseBody?.error || rawText || `HTTP Error ${status}`;
        await testInfo.attach(`⚠️ [DIAGNOSTIC / ERROR REASON - ${status}]`, {
            body: `HTTP Status: ${status} (${response.statusText()})\nEndpoint: ${method} ${url}\nError Message: ${typeof errorReason === 'object' ? JSON.stringify(errorReason) : errorReason}\nTimestamp: ${new Date().toISOString()}`,
            contentType: 'text/plain',
        });
    }

    return { status, body: responseBody || rawText };
}

module.exports = {
    attachApiStep,
};
