import { expect, test } from '@playwright/test';

test.describe('Authentication flows', () => {
  test('login page renders form fields', async ({ page }) => {
    await page.goto('/en/login');

    await expect(page.getByText(/welcome back/i).first()).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /log in/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /forgot/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /sign up/i }).first(),
    ).toBeVisible();
  });

  test('login validates email format', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.locator('#email')).toBeVisible();

    await page.locator('#email').fill('not-an-email');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).first().click();

    const isInvalid = await page.locator('#email').evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);
  });

  test('register page shows all required fields', async ({ page }) => {
    await page.goto('/en/register');

    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#organizationName')).toBeVisible();
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
  });

  test('forgot password page shows email input and back link', async ({
    page,
  }) => {
    await page.goto('/en/forgot-password');

    await expect(page.locator('#email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /send reset/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /back to login/i }),
    ).toBeVisible();
  });

  test('unauthenticated dashboard access redirects to login', async ({
    page,
  }) => {
    await page.goto('/en/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Arabic login page is RTL', async ({ page }) => {
    await page.goto('/ar/login');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });
});
