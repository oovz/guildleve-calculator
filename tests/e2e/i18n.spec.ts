import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n) support', () => {
    test('should switch language from EN to ZH-Hans via settings', async ({ page }) => {
        // Start on English page
        await page.goto('/en');

        // Verify initial English content
        await expect(page.getByText(/RECORDS/)).toBeVisible();

        // Open Settings
        await page.locator('button:has(svg.lucide-settings)').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Find Interface Language select
        // Index 0 is translation, but let's be safer
        await page.getByRole('combobox').nth(0).click();

        // Select Chinese
        await page.getByRole('option', { name: /简体中文/i }).click();

        // Wait for navigation and verify Chinese content
        await page.waitForURL('**/zh-Hans**');

        // Wait for UI to update
        await expect(page.getByPlaceholder('搜索当前列表...')).toBeVisible();
    });

    test('should switch language from ZH-Hans to EN via settings', async ({ page }) => {
        // Start on Chinese page
        await page.goto('/zh-Hans');

        // Verify initial Chinese content
        await expect(page.getByPlaceholder('搜索当前列表...')).toBeVisible();

        // Open Settings
        await page.locator('button:has(svg.lucide-settings)').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Click language selector
        await page.getByRole('combobox').nth(0).click();

        // Select English
        await page.getByRole('option', { name: /English/i }).click();

        // Wait for navigation and verify English content
        await page.waitForURL('**/en**');
        await expect(page.getByPlaceholder('Search current list...')).toBeVisible();
    });

    test('should load Chinese UI via deep link /zh-Hans', async ({ page }) => {
        // Navigate directly to Chinese home page
        await page.goto('/zh-Hans');

        // Wait for load
        await expect(page.getByPlaceholder('搜索当前列表...')).toBeVisible();
        await expect(page.getByText('理符列表')).toBeVisible();
    });

    test('should default to English when accessing root path', async ({ page }) => {
        // Access the root redirect
        await page.goto('/');

        // Should redirect to /en
        await page.waitForURL('**/en');

        // Verify English content
        await expect(page.getByPlaceholder('Search current list...')).toBeVisible();
    });
});
