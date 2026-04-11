import { ArrowLeft, Copy, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getGroup, listParticipantsInGroup } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) return { title: 'Group' };
  const group = await getGroup(profile.organizationId, id);
  return { title: group?.name ?? 'Group' };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const [group, participants] = await Promise.all([
    getGroup(profile.organizationId, id),
    listParticipantsInGroup(profile.organizationId, id),
  ]);

  if (!group) notFound();

  const t = await getTranslations('groups');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qudurat.com';
  const publicLink = `${appUrl}/assess/${group.token}`;

  const completed = participants.filter((p) => p.status === 'completed').length;
  const completionPct =
    participants.length > 0
      ? Math.round((completed / participants.length) * 100)
      : 0;

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/groups"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to groups
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {group.name}
          </h1>
          <Badge
            variant={
              group.status === 'active'
                ? 'success'
                : group.status === 'completed'
                  ? 'default'
                  : group.status === 'archived'
                    ? 'secondary'
                    : 'outline'
            }
          >
            {t(`status.${group.status}`)}
          </Badge>
        </div>
        {group.description && (
          <p className="mt-2 text-muted-foreground">{group.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Assessment: <strong>{group.assessmentTitle}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {participants.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {completionPct}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public link */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Public assessment link</CardTitle>
          <CardDescription>
            Share this link with participants to take the assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
            <code className="flex-1 truncate">{publicLink}</code>
            <Button size="sm" variant="ghost">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participants table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {participants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No participants yet. Share the link above to invite participants.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Score</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === 'completed'
                            ? 'success'
                            : p.status === 'active'
                              ? 'default'
                              : p.status === 'abandoned'
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono">
                      {p.score !== null ? `${p.score}%` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.completedAt
                        ? new Intl.DateTimeFormat(locale, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(p.completedAt))
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
