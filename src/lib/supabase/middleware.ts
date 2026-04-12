import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/types';

/**
 * Refresh the Supabase session on every request.
 *
 * This is critical for Server Components — without this, the session
 * token expires and SSR starts showing logged-out content to logged-in users.
 *
 * Called from `middleware.ts`. The returned response carries updated cookies.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not remove `supabase.auth.getUser()`.
  // This call triggers the cookie refresh. Removing it breaks SSR auth.
  await supabase.auth.getUser();

  return response;
}
