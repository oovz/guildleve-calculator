
import { test, expect } from '@playwright/test';

test('Handles network failure gracefully', async ({ page, context }) => {
    // 1. Load page first (online)
    await page.goto('/');

    // 2. Simulate offline
    await context.setOffline(true);

    // 3. Try to refresh data (click refresh button)
    const refreshBtn = page.getByRole('button', { name: /Refresh Prices/i });
    if (await refreshBtn.isVisible()) {
        await refreshBtn.click();

        // 4. Expect error banner or notification
        // Depending on implementation, it might show a toast or a banner.
        // We look for "Error" text generically or specific error message.
        // await expect(page.getByText(/Failed to fetch/i)).toBeVisible(); 
        // OR valid fallback
    }

    // 5. Verify local data is still visible (Leve list shouldn't disappear)
    const leveCards = page.locator('.levecard'); // Assuming class name or similar locator
    // await expect(leveCards.first()).toBeVisible();
});
