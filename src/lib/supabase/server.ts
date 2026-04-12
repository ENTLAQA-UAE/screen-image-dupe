import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/supabase/types';

/**
 * Server-side Supabase client bound to the incoming request cookies.
 * Use from Server Components, Server Actions, Route Handlers.
 *
 * This client respects RLS policies for the authenticated user.
 * For privileged operations that must bypass RLS, use `createAdminClient()` below.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as any);
            });
          } catch {
            // Server Components cannot set cookies. This is expected;
            // cookie writes happen in middleware or Route Handlers instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client. Bypasses RLS.
 *
 * DANGER: Only use for:
 *   - Webhook handlers (Stripe, Lemon Squeezy) that must write without a user context
 *   - Cron jobs (domain verification, digest delivery)
 *   - Admin operations (super admin console)
 *
 * Never expose to client. Never use without explicit authorization checks.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    },
  );
}
