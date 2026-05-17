// ============================================
// Frontend UI Automation: Admin Dashboard Homepage & Navigation
// ============================================
// Target URL: https://dev.mycoifeur.com.sa/en/admin/overview
// ============================================

const { test, expect } = require('@playwright/test');
const { ADMIN_CREDENTIALS } = require('../helpers/auth.helper');

test.describe('Admin Dashboard Homepage UI Tests', () => {

    test.beforeEach(async ({ page }) => {
        console.log('🌐 Navigating to Admin Login page...');
        await page.goto('https://dev.mycoifeur.com.sa/en/admin-login');
        
        console.log('🔑 Logging in with valid credentials...');
        await page.locator('#email').fill(ADMIN_CREDENTIALS.user);
        await page.locator('#password').fill(ADMIN_CREDENTIALS.password);
        
        console.log('🔘 Clicking Sign In Button...');
        await page.getByRole('button', { name: 'Sign in' }).click();
        
        console.log('⏳ Waiting for dashboard overview page redirection...');
        // Wait for redirect to dashboard overview page
        await page.waitForURL('**/admin/overview', { timeout: 15000 });
        expect(page.url()).toContain('/admin/overview');
    });

    test('TC-DASH-01: [UI Check] Verify Dashboard overview structure and key metrics', async ({ page }) => {
        console.log('🔍 Checking main dashboard headings...');
        
        // Assert overview main heading (h1) is visible and contains "Overview"
        const mainHeading = page.locator('h1').first();
        await expect(mainHeading).toBeVisible();
        await expect(mainHeading).toContainText('Overview');
        
        await expect(page.locator('text=Today\'s Overview')).toBeVisible();
        await expect(page.locator('text=Today\'s operations snapshot')).toBeVisible();
        await expect(page.locator('text=Live operations feed')).toBeVisible();
        
        console.log('🔍 Checking stats cards items...');
        // Verify key operational metric cards exist (using .first() to prevent strict-mode violations)
        await expect(page.locator('text=New bookings').first()).toBeVisible();
        await expect(page.locator('text=Pending approvals').first()).toBeVisible();
        await expect(page.locator('text=Active ongoing').first()).toBeVisible();
        await expect(page.locator('text=Completed today').first()).toBeVisible();
        
        console.log('🔍 Checking operations snapshot...');
        await expect(page.locator('text=Bookings today').first()).toBeVisible();
        await expect(page.locator('text=Revenue today').first()).toBeVisible();
        
        console.log('✅ Dashboard overview homepage UI components validated successfully!');
    });

    test('TC-DASH-02: [Functionality] Verify Sidebar menu interaction and navigation links', async ({ page }) => {
        console.log('🔘 Checking Sidebar menu visibility...');
        
        const sidebarToggleButton = page.locator('button[data-sidebar="trigger"]').first();
        await expect(sidebarToggleButton).toBeVisible();
        
        // Check if the 'Bookings' menu item is already visible to determine sidebar state
        const isSidebarExpanded = await page.locator('text=Bookings').first().isVisible();
        
        if (!isSidebarExpanded) {
            console.log('🔘 Sidebar is collapsed, clicking toggle button to expand...');
            await sidebarToggleButton.click();
            // Wait for CSS slide-in transitions to complete
            await page.waitForTimeout(500);
        } else {
            console.log('ℹ️ Sidebar is already expanded, proceeding with navigation checks.');
        }
        
        console.log('🔍 Verifying sidebar navigation items are visible...');
        
        // Assert that the sidebar links are visible on the page
        await expect(page.locator('text=Bookings').first()).toBeVisible();
        await expect(page.locator('text=Providers').first()).toBeVisible();
        await expect(page.locator('text=Customers').first()).toBeVisible();
        await expect(page.locator('text=Finance').first()).toBeVisible();
        await expect(page.locator('text=Admin Management').first()).toBeVisible();
        await expect(page.locator('text=Categories').first()).toBeVisible();
        await expect(page.locator('text=Promo Codes').first()).toBeVisible();
        
        console.log('✅ Sidebar navigation menus verified successfully!');
    });
});
