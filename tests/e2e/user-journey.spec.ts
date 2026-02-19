
import { test, expect } from '@playwright/test';

test('Basic UI Smoke Test', async ({ page }) => {
    // 1. Landing
    await page.goto('/en');
    await expect(page).toHaveTitle(/Guildleve Calculator/i);

    // 2. Settings Panel
    await page.locator('button:has(svg.lucide-settings)').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    // 3. Mode Toggle
    await page.getByRole('button', { name: 'Leveling', exact: true }).click();
    await expect(page.getByText('SORTED BY Leveling')).toBeVisible();

    // 4. Search Bar interaction
    const searchInput = page.getByPlaceholder('Search current list...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Test');
    await expect(searchInput).toHaveValue('Test');
});
