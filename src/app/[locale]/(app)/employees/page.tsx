import { Plus, Upload, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
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
import { listEmployees } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employees' });
  return { title: t('title') };
}

export default async function EmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; department?: string }>;
}) {
  const { locale } = await params;
  const { q, department } = await searchParams;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const t = await getTranslations('employees');
  const tc = await getTranslations('common');

  const { rows, total } = await listEmployees(profile.organizationId, {
    search: q,
    department,
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/employees/import">
                <Upload className="h-4 w-4" />
                {t('import')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="h-4 w-4" />
                {t('new')}
              </Link>
            </Button>
          </div>
        }
      />

      <form className="mb-6 flex gap-3">
        <Input
          name="q"
          placeholder={tc('search')}
          defaultValue={q}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          {tc('filter')}
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="h-4 w-4" />
                {t('empty.cta')}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.email')}</TableHead>
                <TableHead>{t('columns.code')}</TableHead>
                <TableHead>{t('columns.department')}</TableHead>
                <TableHead>{t('columns.jobTitle')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      href={`/employees/${e.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {e.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.email}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {e.employeeCode ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {e.department ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.jobTitle ?? '—'}
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
