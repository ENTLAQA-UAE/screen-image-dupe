import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('English landing renders with hero and CTA', async ({ page }) => {
    await page.goto('/en');

    // Should NOT redirect — /en is canonical
    await expect(page).toHaveURL(/\/en\/?$/);

    // Hero headline should be visible
    await expect(
      page.getByRole('heading', { level: 1 }).first(),
    ).toBeVisible();

    // Primary CTA links to /register
    const cta = page.getByRole('link', { name: /trial/i }).first();
    await expect(cta).toBeVisible();

    // Nav has login link
    await expect(
      page.getByRole('link', { name: /log in/i }).first(),
    ).toBeVisible();

    // Footer is present
    await expect(page.getByText(/all rights reserved/i)).toBeVisible();
  });

  test('Arabic landing renders in RTL with Arabic content', async ({ page }) => {
    await page.goto('/ar');

    // HTML should have dir=rtl and lang=ar
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    // Hero headline should be visible
    await expect(
      page.getByRole('heading', { level: 1 }).first(),
    ).toBeVisible();
  });

  test('locale switching navigates correctly', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/?$/);

    // Direct navigation to Arabic
    await page.goto('/ar');
    await expect(page).toHaveURL(/\/ar\/?$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('pricing page lists three plans', async ({ page }) => {
    await page.goto('/en/pricing');

    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/professional/i).first()).toBeVisible();
    await expect(page.getByText(/enterprise/i).first()).toBeVisible();
    await expect(page.getByText(/most popular/i)).toBeVisible();
  });
});
