import { headers } from 'next/headers';

/**
 * Read tenant context from request headers (set by middleware.ts).
 *
 * Call from Server Components and Server Actions to get the current tenant.
 * Returns null if the request is on a platform host (e.g., marketing site).
 */
export async function getTenantFromHeaders(): Promise<{
  id: string;
  subdomain: string | null;
  plan: string;
} | null> {
  const h = await headers();
  const id = h.get('x-tenant-id');
  if (!id) return null;

  return {
    id,
    subdomain: h.get('x-tenant-subdomain'),
    plan: h.get('x-tenant-plan') ?? 'starter',
  };
}
