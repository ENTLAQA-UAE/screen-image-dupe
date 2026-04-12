import { Shield, UserPlus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Members',
};

interface Member {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  createdAt: string;
}

async function listMembers(organizationId: string): Promise<Member[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('organization_id', organizationId);

  if (!profiles || profiles.length === 0) return [];

  const profileIds = (profiles as Array<{ id: string }>).map((p) => p.id);
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', profileIds);

  const rolesByUser = new Map<string, string[]>();
  for (const row of roles ?? []) {
    const r = row as unknown as { user_id: string; role: string };
    if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
    rolesByUser.get(r.user_id)!.push(r.role);
  }

  return (profiles as Array<{
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  }>).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    roles: rolesByUser.get(p.id) ?? [],
    createdAt: p.created_at,
  }));
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);
  if (!profile.isOrgAdmin) notFound();

  const members = await listMembers(profile.organizationId);

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <PageHeader
        title="Members & roles"
        description="Manage who has access to your organization"
        action={
          <Button disabled>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        }
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
        Invite flow requires the tenant email provider system. Will be
        activated in Phase 2 Week 7.
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Invite your team to collaborate on assessments."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No roles
                        </span>
                      ) : (
                        m.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={
                              r === 'super_admin'
                                ? 'destructive'
                                : r === 'org_admin'
                                  ? 'default'
                                  : 'outline'
                            }
                          >
                            <Shield className="h-3 w-3" />
                            {r.replace('_', ' ')}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(m.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
