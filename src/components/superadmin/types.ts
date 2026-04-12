export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string | null;
  is_active: boolean | null;
}

export interface OrganizationStats {
  assessments: number;
  participants: number;
  groups: number;
}

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  organization_name?: string;
  roles: string[];
}

export type AppRole = "super_admin" | "org_admin" | "hr_admin";

export type ActiveSection = 'dashboard' | 'organizations' | 'users' | 'subscriptions' | 'settings';

export const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  professional: 'bg-accent/10 text-accent border-accent/20',
  enterprise: 'bg-highlight/10 text-highlight border-highlight/20',
};

export const planFeatures: Record<string, string[]> = {
  free: ['5 assessments', '50 participants/month', 'Basic reports'],
  starter: ['25 assessments', '250 participants/month', 'Standard reports', 'Email support'],
  professional: ['Unlimited assessments', '1000 participants/month', 'Advanced analytics', 'Priority support'],
  enterprise: ['Unlimited everything', 'Custom branding', 'API access', 'Dedicated support', 'SSO'],
};
