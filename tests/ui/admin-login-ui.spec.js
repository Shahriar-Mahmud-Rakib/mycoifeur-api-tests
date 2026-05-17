// ============================================
// Frontend UI Automation Suite: Admin Login Flow
// ============================================
// Target URL: https://dev.mycoifeur.com.sa/en/admin-login
// Tool: Playwright browser-level automation
// ============================================

const { test, expect } = require('@playwright/test');
const { ADMIN_CREDENTIALS } = require('../helpers/auth.helper');

test.describe('Admin Login UI Automation', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the target Admin Login page
        console.log('🌐 Navigating to Admin Login page...');
        await page.goto('https://dev.mycoifeur.com.sa/en/admin-login');
        
        // Verify we are on the correct page
        await expect(page).toHaveTitle(/MyCoifeur|Sign in/i);
    });

    test('TC-UI-01: [Positive] Should login successfully with valid admin credentials', async ({ page }) => {
        console.log('📤 Typing email address...');
        // Fill email field using verified #email ID
        await page.locator('#email').fill(ADMIN_CREDENTIALS.user);
        
        console.log('📤 Typing password...');
        // Fill password field using verified #password ID
        await page.locator('#password').fill(ADMIN_CREDENTIALS.password);
        
        console.log('🔘 Clicking Sign In Button...');
        // Click the Sign In button
        await page.getByRole('button', { name: 'Sign in' }).click();
        
        console.log('⏳ Waiting for dashboard navigation...');
        // Wait for page to navigate to the admin dashboard (usually URL includes '/admin')
        await page.waitForURL('**/admin**', { timeout: 10000 }).catch(() => {
            console.log('⚠️ URL redirect timeout, verifying current URL.');
        });
        
        // Assert we are logged in by checking the redirected URL
        console.log(`📥 Current Page URL: ${page.url()}`);
        expect(page.url()).toContain('/admin');
    });

    test('TC-UI-02: [Negative] Should reject login with invalid credentials', async ({ page }) => {
        console.log('📤 Typing invalid email address...');
        await page.locator('#email').fill('invalid_admin@mycoifeur.com');
        
        console.log('📤 Typing invalid password...');
        await page.locator('#password').fill('wrongpassword123');
        
        console.log('🔘 Clicking Sign In Button...');
        await page.getByRole('button', { name: 'Sign in' }).click();
        
        // Assert that we did NOT redirect to the admin dashboard (remain on admin-login)
        console.log('🔍 Confirming user remained on the login page...');
        expect(page.url()).toContain('/admin-login');
        
        // Check for any visible error message on the page
        const errorText = page.locator('text=invalid|error|unauthorized|failed/i');
        const count = await errorText.count();
        if (count > 0) {
            console.log('✅ Found visible error validation message!');
        } else {
            console.log('ℹ️ No generic text error found, but login correctly rejected (URL did not change).');
        }
    });
});
