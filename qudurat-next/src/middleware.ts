import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import { resolveTenant } from '@/lib/tenant/resolve';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Root middleware — runs on every request.
 *
 * Three concerns handled in order:
 *   1. Hostname-based tenant resolution (inject x-tenant-id header)
 *   2. Supabase session refresh (update auth cookies)
 *   3. Locale detection and routing (next-intl)
 *
 * Execution order matters: tenant must be resolved first because downstream
 * Server Components read it from headers. Auth must refresh before locale
 * routing because redirects carry the updated cookies.
 */
export async function middleware(request: NextRequest) {
  // Skip for static assets, API routes, and public files
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assess/') || // public assessment taker (no locale prefix)
    pathname.match(/\.(ico|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|css|js)$/i)
  ) {
    return NextResponse.next();
  }

  // --- Concern 1: Tenant Resolution ---
  const hostname = request.headers.get('host') ?? '';
  const tenant = await resolveTenant(hostname);

  // --- Concern 3 (must run BEFORE session refresh to get the response shell) ---
  // next-intl builds its own response; we merge tenant headers and refresh auth on top.
  const intlResponse = intlMiddleware(request);

  // If next-intl returned a redirect, respect it
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  // --- Concern 2: Supabase Session Refresh ---
  const response = await updateSession(request, intlResponse);

  // --- Final: Inject tenant context headers for Server Components ---
  if (tenant) {
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-subdomain', tenant.subdomain ?? '');
    response.headers.set('x-tenant-plan', tenant.plan);
  }

  return response;
}

export const config = {
  // Skip all internal paths and static files by default.
  // Use negative lookahead to be explicit about what we DO match.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
