import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

/**
 * Browser-side Supabase client.
 * Use from Client Components only.
 *
 * Creates a new client per invocation — safe because cookie handling
 * is delegated to the browser's native cookie store.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
