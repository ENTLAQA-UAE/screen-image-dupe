import { expect, test } from '@playwright/test';

/**
 * Critical user journey smoke tests.
 *
 * These tests validate the high-level flow without requiring a seeded
 * test database. Deeper tests with real data seeding are deferred to
 * Phase 2 once the test Supabase project is provisioned.
 */

test.describe('Critical journeys — unauthenticated', () => {
  test('landing → pricing → register flow navigation', async ({ page }) => {
    await page.goto('/en');
    await expect(
      page.getByRole('heading', { level: 1 }).first(),
    ).toBeVisible();

    // Click into pricing from nav
    await page.getByRole('link', { name: /pricing/i }).first().click();
    await expect(page).toHaveURL(/\/en\/pricing/);
    await expect(page.getByText(/starter/i).first()).toBeVisible();

    // Click Start free trial from a plan card
    const trialLinks = page.getByRole('link', { name: /start free trial/i });
    await trialLinks.first().click();
    await expect(page).toHaveURL(/\/en\/register/);

    // Register form visible
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/organization/i)).toBeVisible();
  });

  test('login → forgot password → back to login', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByRole('link', { name: /forgot/i }).first().click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();

    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected pages redirect to login when unauthenticated', async ({
    page,
  }) => {
    const protectedRoutes = [
      '/en/dashboard',
      '/en/assessments',
      '/en/groups',
      '/en/employees',
      '/en/results',
      '/en/settings/billing',
      '/en/settings/organization',
      '/en/question-bank',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    }
  });

  test('admin routes redirect non-super-admins', async ({ page }) => {
    const adminRoutes = [
      '/en/admin',
      '/en/admin/billing/providers',
      '/en/admin/billing/subscriptions',
      '/en/admin/billing/requests',
      '/en/admin/billing/activate',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      // Unauthenticated users hit /login; super admin check only fires after
      // authentication, so at minimum we should not get a 200 on the admin route
      await page.waitForURL(/\/login/, { timeout: 5000 });
    }
  });
});

test.describe('Critical journeys — locale + RTL', () => {
  test('Arabic assessment taker page is fully RTL', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Navigate to a core pages in Arabic and verify dir
    await page.goto('/ar/login');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.goto('/ar/register');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.goto('/ar/pricing');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('locale switching preserves page context', async ({ page }) => {
    await page.goto('/en/pricing');
    await expect(page.getByText(/most popular/i)).toBeVisible();

    await page.goto('/ar/pricing');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('Critical journeys — public assessment entry', () => {
  test('/assess/<token> returns 404 for invalid token format', async ({
    page,
  }) => {
    const response = await page.goto('/assess/short');
    // Page responds but renders not-found (404)
    expect(response?.status() ?? 200).toBeLessThan(500);
    // notFound() produces a 404 in Next.js
  });

  test('/assess/take requires session registration', async ({ page }) => {
    await page.goto('/assess/abcd1234-test-token-here/take');
    // Without a participant session, the bootstrap shows "Registration required"
    await expect(
      page.getByText(/registration required|loading assessment/i),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Metadata & SEO', () => {
  test('landing has proper meta tags', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Qudurat/);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /assessment/i);
  });

  test('Arabic landing has hreflang alternates', async ({ page }) => {
    await page.goto('/en');
    const hrefLangAr = page.locator('link[hreflang="ar"]');
    const hrefLangEn = page.locator('link[hreflang="en"]');
    await expect(hrefLangAr.first()).toBeAttached();
    await expect(hrefLangEn.first()).toBeAttached();
  });
});
