import 'server-only';

import { createClient } from '@/lib/supabase/server';

import type {
  Assessment,
  AssessmentGroup,
  AssessmentResult,
  Employee,
  Participant,
} from './types';

// ==============================================================================
// Assessments
// DB columns: id, config, created_at, created_by, description, is_graded,
//             language, organization_id, status, title, type
// NO: category, updated_at
// ==============================================================================

export async function listAssessments(
  organizationId: string,
  opts: {
    search?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ rows: Assessment[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('assessments')
    .select(
      'id, organization_id, title, description, type, status, language, is_graded, created_at, questions(count)',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (opts.search) {
    query = query.ilike('title', `%${opts.search}%`);
  }
  if (opts.type && opts.type !== 'all') {
    query = query.eq('type', opts.type);
  }
  if (opts.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: Assessment[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      organization_id: string;
      title: string;
      description: string | null;
      type: string;
      status: string | null;
      language: string | null;
      is_graded: boolean | null;
      created_at: string | null;
      questions?: { count: number }[];
    };
    return {
      id: r.id,
      organizationId: r.organization_id,
      title: r.title,
      description: r.description,
      type: (r.type ?? 'custom') as Assessment['type'],
      status: (r.status ?? 'draft') as Assessment['status'],
      language: (r.language ?? 'en') as Assessment['language'],
      category: r.is_graded ? 'graded_quiz' : 'profile',
      isGraded: r.is_graded ?? false,
      questionCount: r.questions?.[0]?.count ?? 0,
      createdAt: r.created_at ?? '',
      updatedAt: r.created_at ?? '',
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getAssessment(
  organizationId: string,
  assessmentId: string,
): Promise<Assessment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('assessments')
    .select(
      'id, organization_id, title, description, type, status, language, is_graded, created_at, questions(count)',
    )
    .eq('organization_id', organizationId)
    .eq('id', assessmentId)
    .maybeSingle();

  if (error || !data) return null;

  const r = data as unknown as {
    id: string;
    organization_id: string;
    title: string;
    description: string | null;
    type: string;
    status: string | null;
    language: string | null;
    is_graded: boolean | null;
    created_at: string | null;
    questions?: { count: number }[];
  };

  return {
    id: r.id,
    organizationId: r.organization_id,
    title: r.title,
    description: r.description,
    type: (r.type ?? 'custom') as Assessment['type'],
    status: (r.status ?? 'draft') as Assessment['status'],
    language: (r.language ?? 'en') as Assessment['language'],
    category: r.is_graded ? 'graded_quiz' : 'profile',
    isGraded: r.is_graded ?? false,
    questionCount: r.questions?.[0]?.count ?? 0,
    createdAt: r.created_at ?? '',
    updatedAt: r.created_at ?? '',
  };
}

// ==============================================================================
// Groups
// DB columns: id, assessment_id, created_at, end_date, group_link_token,
//             is_active, name, organization_id, start_date
// NO: status, description, token, deadline
// ==============================================================================

export async function listGroups(
  organizationId: string,
  opts: { search?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: AssessmentGroup[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('assessment_groups')
    .select(
      'id, organization_id, assessment_id, name, is_active, group_link_token, end_date, created_at, assessments(title), participants(count)',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (opts.search) query = query.ilike('name', `%${opts.search}%`);

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: AssessmentGroup[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      organization_id: string;
      assessment_id: string;
      name: string;
      is_active: boolean | null;
      group_link_token: string | null;
      end_date: string | null;
      created_at: string;
      assessments?: { title: string } | { title: string }[];
      participants?: { count: number }[];
    };
    const assessmentTitle = Array.isArray(r.assessments)
      ? r.assessments[0]?.title ?? ''
      : r.assessments?.title ?? '';
    return {
      id: r.id,
      organizationId: r.organization_id,
      assessmentId: r.assessment_id,
      assessmentTitle,
      name: r.name,
      description: null,
      status: r.is_active ? 'active' : 'draft',
      token: r.group_link_token ?? '',
      deadline: r.end_date,
      participantCount: r.participants?.[0]?.count ?? 0,
      completedCount: 0,
      createdAt: r.created_at,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getGroup(
  organizationId: string,
  groupId: string,
): Promise<AssessmentGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assessment_groups')
    .select(
      'id, organization_id, assessment_id, name, is_active, group_link_token, end_date, created_at, assessments(title), participants(count)',
    )
    .eq('organization_id', organizationId)
    .eq('id', groupId)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as unknown as {
    id: string;
    organization_id: string;
    assessment_id: string;
    name: string;
    is_active: boolean | null;
    group_link_token: string | null;
    end_date: string | null;
    created_at: string;
    assessments?: { title: string };
    participants?: { count: number }[];
  };
  return {
    id: r.id,
    organizationId: r.organization_id,
    assessmentId: r.assessment_id,
    assessmentTitle: r.assessments?.title ?? '',
    name: r.name,
    description: null,
    status: r.is_active ? 'active' : 'draft',
    token: r.group_link_token ?? '',
    deadline: r.end_date,
    participantCount: r.participants?.[0]?.count ?? 0,
    completedCount: 0,
    createdAt: r.created_at,
  };
}

// ==============================================================================
// Participants
// DB columns: id, access_token, ai_report_text, completed_at, department,
//             email, employee_code, full_name, group_id, job_title,
//             organization_id, score_summary, started_at, status, submission_type
// NO: score (it's score_summary JSONB)
// ==============================================================================

export async function listParticipantsInGroup(
  organizationId: string,
  groupId: string,
): Promise<Participant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('participants')
    .select(
      'id, organization_id, group_id, full_name, email, employee_code, department, job_title, status, started_at, completed_at, score_summary',
    )
    .eq('organization_id', organizationId)
    .eq('group_id', groupId)
    .order('full_name', { ascending: true });

  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      organization_id: string;
      group_id: string | null;
      full_name: string;
      email: string;
      employee_code: string | null;
      department: string | null;
      job_title: string | null;
      status: string;
      started_at: string | null;
      completed_at: string | null;
      score_summary: unknown;
    };
    const scoreSummary = r.score_summary as { percentage?: number; total_score?: number } | null;
    const score = scoreSummary?.percentage ?? scoreSummary?.total_score ?? null;

    return {
      id: r.id,
      organizationId: r.organization_id,
      groupId: r.group_id,
      fullName: r.full_name,
      email: r.email,
      employeeCode: r.employee_code,
      department: r.department,
      jobTitle: r.job_title,
      status: (r.status ?? 'invited') as Participant['status'],
      startedAt: r.started_at,
      completedAt: r.completed_at,
      score: typeof score === 'number' ? score : null,
    };
  });
}

// ==============================================================================
// Employees — derived from participants (no separate employees table)
// ==============================================================================

export async function listEmployees(
  organizationId: string,
  opts: { search?: string; department?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: Employee[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('participants')
    .select(
      'id, organization_id, full_name, email, employee_code, department, job_title, created_at',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('full_name', { ascending: true });

  if (opts.search) {
    query = query.or(
      `full_name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`,
    );
  }

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  // Deduplicate by email
  const seen = new Set<string>();
  const unique: Employee[] = [];

  for (const row of data ?? []) {
    const r = row as unknown as {
      id: string;
      organization_id: string;
      full_name: string;
      email: string;
      employee_code: string | null;
      department: string | null;
      job_title: string | null;
      created_at: string;
    };
    if (r.email && seen.has(r.email)) continue;
    if (r.email) seen.add(r.email);

    unique.push({
      id: r.id,
      organizationId: r.organization_id,
      fullName: r.full_name,
      email: r.email,
      employeeCode: r.employee_code,
      department: r.department,
      jobTitle: r.job_title,
      assessmentsCompleted: 0,
      lastAssessmentAt: null,
      createdAt: r.created_at,
    });
  }

  return { rows: unique, total: count ?? 0 };
}

// ==============================================================================
// Results
// ==============================================================================

export async function listResults(
  organizationId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ rows: AssessmentResult[]; total: number }> {
  const supabase = await createClient();

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const { data, count, error } = await supabase
    .from('participants')
    .select(
      'id, organization_id, full_name, score_summary, completed_at, assessment_groups!inner(assessment_id, assessments!inner(id, title, type))',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const rows: AssessmentResult[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      organization_id: string;
      full_name: string;
      score_summary: unknown;
      completed_at: string;
      assessment_groups?: {
        assessment_id: string;
        assessments?: { id: string; title: string; type: string };
      };
    };
    const scoreSummary = r.score_summary as { percentage?: number; total_score?: number } | null;
    const score = scoreSummary?.percentage ?? scoreSummary?.total_score ?? null;

    return {
      id: r.id,
      organizationId: r.organization_id,
      participantId: r.id,
      participantName: r.full_name,
      assessmentId: r.assessment_groups?.assessment_id ?? '',
      assessmentTitle: r.assessment_groups?.assessments?.title ?? '',
      assessmentType: (r.assessment_groups?.assessments?.type ??
        'custom') as AssessmentResult['assessmentType'],
      score: typeof score === 'number' ? score : null,
      completedAt: r.completed_at,
      durationSeconds: null,
    };
  });

  return { rows, total: count ?? 0 };
}
