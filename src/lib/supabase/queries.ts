import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * Server-side Supabase queries used across Server Components.
 *
 * All queries here respect RLS policies for the current authenticated user.
 * For admin/service-role queries, use `createAdminClient()` directly.
 */

// ==============================================================================
// User profile & org
// ==============================================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  organizationId: string | null;
  organizationName: string | null;
  roles: string[];
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isHrAdmin: boolean;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch roles
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);

  // Fetch organization name
  let organizationName: string | null = null;
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .maybeSingle();
    organizationName = (org as { name: string } | null)?.name ?? null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    fullName:
      (profile as { full_name?: string } | null)?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'User',
    organizationId: (profile as { organization_id?: string } | null)?.organization_id ?? null,
    organizationName,
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isOrgAdmin: roles.includes('org_admin'),
    isHrAdmin: roles.includes('hr_admin'),
  };
}

// ==============================================================================
// Dashboard stats
// ==============================================================================

export interface DashboardStats {
  totalAssessments: number;
  activeParticipants: number;
  completionRate: number;
  avgScore: number | null;
}

export async function getDashboardStats(
  organizationId: string,
): Promise<DashboardStats> {
  const supabase = await createClient();

  const [assessmentsRes, participantsRes] = await Promise.all([
    supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('participants')
      .select('id, status, score_summary')
      .eq('organization_id', organizationId),
  ]);

  const totalAssessments = assessmentsRes.count ?? 0;
  const participants = participantsRes.data ?? [];
  const activeParticipants = participants.filter(
    (p: { status: string }) => p.status === 'active' || p.status === 'invited',
  ).length;
  const completed = participants.filter(
    (p: { status: string }) => p.status === 'completed',
  ).length;
  const completionRate =
    participants.length > 0
      ? Math.round((completed / participants.length) * 100)
      : 0;

  // Extract scores from score_summary JSONB in participants
  const scores = participants
    .filter((p: { status: string }) => p.status === 'completed')
    .map((p: { score_summary: unknown }) => {
      const summary = p.score_summary as { percentage?: number; total_score?: number } | null;
      return summary?.percentage ?? summary?.total_score ?? null;
    })
    .filter((s): s is number => typeof s === 'number');
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  return {
    totalAssessments,
    activeParticipants,
    completionRate,
    avgScore,
  };
}
