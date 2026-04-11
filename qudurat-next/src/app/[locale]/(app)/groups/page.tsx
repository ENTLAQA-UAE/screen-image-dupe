import { Plus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listGroups } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'groups' });
  return { title: t('title') };
}

export default async function GroupsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await params;
  const { q, status } = await searchParams;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const t = await getTranslations('groups');
  const tc = await getTranslations('common');

  const { rows, total } = await listGroups(profile.organizationId, {
    search: q,
    status,
  });

  return (
    <div className="container py-10">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        }
      />

      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          name="q"
          placeholder={tc('search')}
          defaultValue={q}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? 'all'}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">{tc('all')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="completed">{t('status.completed')}</option>
          <option value="archived">{t('status.archived')}</option>
        </select>
        <Button type="submit" variant="outline">
          {tc('filter')}
        </Button>
      </form>

      {rows.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="h-4 w-4" />
                {t('empty.cta')}
              </Link>
            </Button>
          }
        />
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.assessment')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-end">
                  {t('columns.participants')}
                </TableHead>
                <TableHead>{t('columns.deadline')}</TableHead>
                <TableHead>{t('columns.created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link
                      href={`/groups/${g.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {g.name}
                    </Link>
                    {g.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {g.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.assessmentTitle || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        g.status === 'active'
                          ? 'success'
                          : g.status === 'completed'
                            ? 'default'
                            : g.status === 'archived'
                              ? 'secondary'
                              : 'outline'
                      }
                    >
                      {t(`status.${g.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm">
                    {g.participantCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {g.deadline
                      ? new Intl.DateTimeFormat(locale, {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(g.deadline))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(g.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {rows.length} of {total}
        </div>
      )}
    </div>
  );
}
