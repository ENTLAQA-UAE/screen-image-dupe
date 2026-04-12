import { createAdminClient } from '@/lib/supabase/server';

/**
 * Tenant (organization) as resolved from the request hostname.
 */
export interface Tenant {
  id: string;
  subdomain: string | null;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'trial';
}

const PLATFORM_HOSTS = new Set([
  'qudurat.com',
  'www.qudurat.com',
  'app.qudurat.com',
  'staging.qudurat.com',
  'localhost',
  'localhost:3000',
  'localhost:8080',
]);

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'docs',
  'blog',
  'status',
  'cdn',
  'mail',
  'ftp',
  'staging',
  'dev',
  'test',
  'support',
  'help',
]);

/**
 * Resolve a tenant from the request hostname.
 *
 * Lookup order:
 *   1. Custom domain (exact match against tenant_custom_domains)
 *   2. Subdomain pattern (`{slug}.qudurat.com` → organizations.subdomain)
 *   3. Platform host → no tenant (returns null, middleware renders marketing site)
 *
 * TODO (Phase 2 Week 9): Cache results via Vercel Edge Config / Upstash Redis
 *   to avoid a DB hit on every request. Invalidate on custom-domain add/remove.
 */
export async function resolveTenant(hostname: string): Promise<Tenant | null> {
  if (!hostname) return null;

  // Strip port (handy for localhost dev)
  const host = hostname.split(':')[0]!.toLowerCase();

  // Platform host — no tenant, render marketing site
  if (PLATFORM_HOSTS.has(host) || PLATFORM_HOSTS.has(hostname.toLowerCase())) {
    return null;
  }

  const supabase = createAdminClient();

  // 1. Check custom domain
  const { data: customDomain } = await supabase
    .from('tenant_custom_domains')
    .select('organization_id, organizations!inner(id, subdomain, name, plan)')
    .eq('domain', host)
    .eq('verification_status', 'verified')
    .maybeSingle();

  if (customDomain && (customDomain as unknown as { organizations: Tenant }).organizations) {
    return (customDomain as unknown as { organizations: Tenant }).organizations;
  }

  // 2. Check subdomain pattern: {slug}.qudurat.com
  if (host.endsWith('.qudurat.com')) {
    const slug = host.replace('.qudurat.com', '');
    if (!slug || RESERVED_SUBDOMAINS.has(slug)) {
      return null;
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, subdomain, name, plan')
      .eq('subdomain', slug)
      .maybeSingle();

    return (org as Tenant | null) ?? null;
  }

  // Unknown host — not a tenant
  return null;
}

/**
 * Validate a candidate subdomain slug.
 *
 * Returns an error message, or null if valid.
 */
export function validateSubdomain(slug: string): string | null {
  if (!slug) return 'Subdomain is required';
  if (slug.length < 3) return 'Subdomain must be at least 3 characters';
  if (slug.length > 63) return 'Subdomain must be at most 63 characters';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return 'Subdomain must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphen)';
  }
  if (RESERVED_SUBDOMAINS.has(slug)) {
    return 'This subdomain is reserved';
  }
  return null;
}
