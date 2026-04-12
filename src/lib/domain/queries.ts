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
      'id, organization_id, title, description, type, status, language, category, is_graded, created_at, updated_at, questions(count)',
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
      category: string | null;
      is_graded: boolean | null;
      created_at: string | null;
      updated_at: string | null;
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
      category: (r.category ?? 'graded_quiz') as Assessment['category'],
      isGraded: r.is_graded ?? false,
      questionCount: r.questions?.[0]?.count ?? 0,
      createdAt: r.created_at ?? '',
      updatedAt: r.updated_at ?? '',
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
      'id, organization_id, title, description, type, status, language, category, is_graded, created_at, updated_at, questions(count)',
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
    category: string | null;
    is_graded: boolean | null;
    created_at: string | null;
    updated_at: string | null;
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
    category: (r.category ?? 'graded_quiz') as Assessment['category'],
    isGraded: r.is_graded ?? false,
    questionCount: r.questions?.[0]?.count ?? 0,
    createdAt: r.created_at ?? '',
    updatedAt: r.updated_at ?? '',
  };
}

// ==============================================================================
// Groups
// ==============================================================================

export async function listGroups(
  organizationId: string,
  opts: { search?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: AssessmentGroup[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('assessment_groups')
    .select(
      'id, organization_id, assessment_id, name, description, status, token, deadline, created_at, assessments(title), participants(count)',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (opts.search) query = query.ilike('name', `%${opts.search}%`);
  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);

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
      description: string | null;
      status: string;
      token: string;
      deadline: string | null;
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
      description: r.description,
      status: (r.status ?? 'draft') as AssessmentGroup['status'],
      token: r.token,
      deadline: r.deadline,
      participantCount: r.participants?.[0]?.count ?? 0,
      completedCount: 0, // TODO: separate query for completed count
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
      'id, organization_id, assessment_id, name, description, status, token, deadline, created_at, assessments(title), participants(count)',
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
    description: string | null;
    status: string;
    token: string;
    deadline: string | null;
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
    description: r.description,
    status: (r.status ?? 'draft') as AssessmentGroup['status'],
    token: r.token,
    deadline: r.deadline,
    participantCount: r.participants?.[0]?.count ?? 0,
    completedCount: 0,
    createdAt: r.created_at,
  };
}

export async function listParticipantsInGroup(
  organizationId: string,
  groupId: string,
): Promise<Participant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('participants')
    .select(
      'id, organization_id, group_id, full_name, email, employee_code, department, job_title, status, started_at, completed_at, score',
    )
    .eq('organization_id', organizationId)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

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
      score: number | null;
    };
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
      score: r.score,
    };
  });
}

// ==============================================================================
// Employees
// ==============================================================================

export async function listEmployees(
  organizationId: string,
  opts: { search?: string; department?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: Employee[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('employees')
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
  if (opts.department && opts.department !== 'all') {
    query = query.eq('department', opts.department);
  }

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: Employee[] = (data ?? []).map((row) => {
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
    return {
      id: r.id,
      organizationId: r.organization_id,
      fullName: r.full_name,
      email: r.email,
      employeeCode: r.employee_code,
      department: r.department,
      jobTitle: r.job_title,
      assessmentsCompleted: 0, // TODO: join for actual count
      lastAssessmentAt: null,
      createdAt: r.created_at,
    };
  });

  return { rows, total: count ?? 0 };
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
      'id, organization_id, full_name, score, completed_at, assessment_groups!inner(assessment_id, assessments!inner(id, title, type))',
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
      score: number | null;
      completed_at: string;
      assessment_groups?: {
        assessment_id: string;
        assessments?: { id: string; title: string; type: string };
      };
    };
    return {
      id: r.id,
      organizationId: r.organization_id,
      participantId: r.id,
      participantName: r.full_name,
      assessmentId: r.assessment_groups?.assessment_id ?? '',
      assessmentTitle: r.assessment_groups?.assessments?.title ?? '',
      assessmentType: (r.assessment_groups?.assessments?.type ??
        'custom') as AssessmentResult['assessmentType'],
      score: r.score,
      completedAt: r.completed_at,
      durationSeconds: null,
    };
  });

  return { rows, total: count ?? 0 };
}
