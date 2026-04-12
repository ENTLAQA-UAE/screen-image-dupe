/**
 * Domain models used across Server Components and Client Components.
 *
 * These are UI-facing types — simpler than raw Supabase rows, normalized,
 * and safe to pass to client components (no sensitive columns).
 */

export type AssessmentType =
  | 'cognitive'
  | 'personality'
  | 'situational'
  | 'behavioral'
  | 'language'
  | 'custom';

export type AssessmentStatus = 'draft' | 'active' | 'archived';

export type AssessmentCategory = 'graded_quiz' | 'profile';

export type AssessmentLanguage = 'en' | 'ar' | 'both';

export interface Assessment {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: AssessmentType;
  status: AssessmentStatus;
  language: AssessmentLanguage;
  category: AssessmentCategory;
  isGraded: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentGroup {
  id: string;
  organizationId: string;
  assessmentId: string;
  assessmentTitle: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  token: string;
  deadline: string | null;
  participantCount: number;
  completedCount: number;
  createdAt: string;
}

export interface Participant {
  id: string;
  organizationId: string;
  groupId: string | null;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  jobTitle: string | null;
  status: 'invited' | 'active' | 'completed' | 'abandoned';
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
}

export interface Employee {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  employeeCode: string | null;
  department: string | null;
  jobTitle: string | null;
  assessmentsCompleted: number;
  lastAssessmentAt: string | null;
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  organizationId: string;
  participantId: string;
  participantName: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: AssessmentType;
  score: number | null;
  completedAt: string;
  durationSeconds: number | null;
}
