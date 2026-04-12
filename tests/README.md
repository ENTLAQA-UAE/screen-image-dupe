# Qudurat Tests

This directory contains unit tests (Vitest + React Testing Library) and
end-to-end tests (Playwright) for the Qudurat Next.js app.

## Structure

```
tests/
├── setup.ts                    # Vitest global setup (mocks, env)
├── unit/                       # Unit tests run by Vitest
│   ├── components/             # React component tests
│   ├── i18n/                   # i18n config tests
│   ├── lib/                    # Utility function tests
│   ├── messages/               # Translation parity tests
│   └── tenant/                 # Tenant resolver tests
└── e2e/                        # End-to-end tests run by Playwright
    ├── auth.spec.ts            # Login, register, forgot password flows
    ├── landing.spec.ts         # Marketing page and pricing
    └── security-headers.spec.ts # CSP, HSTS, X-Frame-Options
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Watch mode (for development)
npm run test

# Single run (CI)
npm run test:run

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

Coverage thresholds (enforced in CI):
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

### E2E Tests (Playwright)

```bash
# Run all browsers (chromium + firefox + webkit + mobile)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Headed mode (see the browser)
npm run test:e2e:headed

# Specific test
npx playwright test tests/e2e/landing.spec.ts

# Specific browser
npx playwright test --project=chromium
```

Playwright auto-starts `npm run dev` if nothing is on port 3000. In CI,
the workflow builds and starts the production server first.

## Writing New Tests

### Unit test template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MyComponent } from '@/components/my-component';

describe('<MyComponent />', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E test template

```typescript
import { expect, test } from '@playwright/test';

test.describe('Feature name', () => {
  test('does the thing', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
```

## Mocks

The `tests/setup.ts` file mocks:
- `next/navigation` (useRouter, useSearchParams, usePathname, redirect, notFound)
- `next-intl` (useTranslations, useLocale, NextIntlClientProvider)
- Environment variables for Supabase

For Supabase queries in unit tests, use MSW (`msw` is installed) to intercept
HTTP calls. Example coming in Phase 2.

## What's NOT Tested Yet

These are deferred to later weeks and will fail with placeholder assertions
if you try to run them now:

- Server Actions (login, register, createAssessment) — needs MSW + fixture data
- Real Supabase integration tests — needs a test Supabase project
- Visual regression (Percy / Chromatic) — Phase 3
- Accessibility audits (axe-core) — Phase 3
