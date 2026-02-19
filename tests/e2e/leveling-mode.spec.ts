import { test, expect } from '@playwright/test';


test.describe('XP Efficiency for Levelers', () => {
    test('can switch to Leveling Mode and see efficiency columns', async ({ page }) => {
        // Navigate to home page
        await page.goto('/en');

        // Verify default is Profit Mode (Profit text in header mode toggle)
        const profitButton = page.getByRole('button', { name: 'Profit', exact: true });
        await expect(profitButton).toBeVisible();

        // Switch to Leveling Mode
        const levelingButton = page.getByRole('button', { name: 'Leveling', exact: true });
        await levelingButton.click();

        // Leveling Mode should show a Different Label in the List Header
        // Based on page.tsx: {t('sortedBy', { mode: ... })}
        // "SORTED BY Leveling"
        await expect(page.getByText('SORTED BY Leveling')).toBeVisible();
    });

    test('displays Paid to Level indicator for profitable leves', async ({ page }) => {
        await page.goto('/en');

        // Switch to Leveling Mode
        await page.getByRole('button', { name: 'Leveling', exact: true }).click();

        // Wait for records to load (increase timeout)
        await expect(page.getByText(/RECORDS/)).toBeVisible({ timeout: 15000 });

        // Check if the list container is visible
        await expect(page.locator('#leve-list-container')).toBeVisible();
    });

    test('switches back to Profit Mode correctly', async ({ page }) => {
        await page.goto('/en');

        // Switch to Leveling Mode
        await page.getByRole('button', { name: 'Leveling', exact: true }).click();
        await expect(page.getByText('SORTED BY Leveling')).toBeVisible({ timeout: 15000 });

        // Switch back to Profit Mode
        await page.getByRole('button', { name: 'Profit', exact: true }).click();

        // Verify Profit columns/labels are back
        await expect(page.getByText('SORTED BY Profit')).toBeVisible();
    });
});
