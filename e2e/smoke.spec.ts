import { test, expect } from '@playwright/test';

test.describe('KUBERA Smoke Tests', () => {
  test('landing page loads and renders key elements', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/KUBERA/);

    await expect(page.locator('nav')).toBeVisible();

    await expect(page.locator('h1')).toBeVisible();

    await expect(page.getByRole('link', { name: /pricing|buy|source/i }).first()).toBeVisible();

    await expect(page.locator('footer')).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');

    const pricingLink = page.getByRole('link', { name: /pricing/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page.locator('h2, h1').first()).toBeVisible();
    }
  });

  test('pricing section renders', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      document.getElementById('pricing')?.scrollIntoView();
    });

    await expect(page.getByText(/\$149/).first()).toBeVisible();
    await expect(page.getByText(/\$249/).first()).toBeVisible();
  });
});
