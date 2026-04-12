import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { rpc } from '@/lib/supabase/types';

/**
 * Server-side subscription limit checks.
 *
 * Wraps the `check_subscription_limit()` Postgres function defined in the
 * billing migration. Called from Server Actions before creating billable
 * resources (assessments, groups, participants, AI questions).
 *
 * The DB function is SECURITY DEFINER and bypasses RLS so it can count
 * across all rows without needing admin privileges from the caller.
 */
export type Resource =
  | 'assessments'
  | 'groups'
  | 'users'
  | 'organizations'
  | 'ai_questions';

export async function canCreate(
  organizationId: string,
  resource: Resource,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await rpc(supabase, 'check_subscription_limit', {
    p_org_id: organizationId,
    p_resource: resource,
  });

  if (error) {
    console.error('[limits] check failed', error);
    return false;
  }
  return data === true;
}

/**
 * Same as canCreate but throws a descriptive error instead of returning false.
 * Use from Server Actions that want to fail loud.
 */
export async function assertCanCreate(
  organizationId: string,
  resource: Resource,
): Promise<void> {
  const allowed = await canCreate(organizationId, resource);
  if (!allowed) {
    throw new LimitExceededError(resource);
  }
}

export class LimitExceededError extends Error {
  constructor(public resource: Resource) {
    super(
      `You've reached your plan's ${resource} limit. Upgrade your plan to add more.`,
    );
    this.name = 'LimitExceededError';
  }
}

/**
 * Record a usage event for metered billing metrics.
 */
export async function recordUsage(
  organizationId: string,
  metric: string,
  quantity: number = 1,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('usage_records').insert({
    organization_id: organizationId,
    metric,
    quantity,
  });
}
