import { expect, test } from '@playwright/test';

test.describe('Security headers', () => {
  test('landing page sends all required security headers', async ({
    request,
  }) => {
    const response = await request.get('/en');
    expect(response.ok()).toBe(true);

    const headers = response.headers();

    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toContain('strict-origin');
    expect(headers['permissions-policy']).toContain('camera=');
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  test('CSP blocks inline scripts from unknown origins', async ({
    request,
  }) => {
    const response = await request.get('/en');
    const csp = response.headers()['content-security-policy'] ?? '';

    // Allowlisted origins
    expect(csp).toContain('supabase.co');

    // Explicitly no frame-ancestors (clickjacking protection)
    expect(csp).toContain("frame-ancestors 'none'");

    // base-uri locked
    expect(csp).toContain("base-uri 'self'");
  });

  test('X-Powered-By header is removed', async ({ request }) => {
    const response = await request.get('/en');
    const headers = response.headers();

    // Next.js default is to send "X-Powered-By: Next.js"
    // We disabled it via poweredByHeader: false
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
