import { Mail, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EmailProviderForm } from '@/app/[locale]/(app)/settings/email/email-provider-form';
import { EmailLogTable } from '@/app/[locale]/(app)/settings/email/email-log-table';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Email provider settings',
};

async function getEmailProviders(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_email_providers')
    .select(
      'id, provider_type, display_name, is_primary, is_active, from_email, from_name, reply_to, smtp_host, smtp_port, smtp_secure, smtp_username, provider_domain, provider_region, last_tested_at, last_test_status, last_test_error, created_at, updated_at',
    )
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false });

  return (data ?? []) as Array<{
    id: string;
    provider_type: string;
    display_name: string | null;
    is_primary: boolean;
    is_active: boolean;
    from_email: string;
    from_name: string | null;
    reply_to: string | null;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_secure: boolean | null;
    smtp_username: string | null;
    provider_domain: string | null;
    provider_region: string | null;
    last_tested_at: string | null;
    last_test_status: string | null;
    last_test_error: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

async function getRecentEmailLogs(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_email_logs')
    .select('id, to_email, subject, template_key, status, error_message, sent_at, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []) as Array<{
    id: string;
    to_email: string;
    subject: string;
    template_key: string | null;
    status: string;
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
  }>;
}

export default async function EmailSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);
  if (!profile.isOrgAdmin) notFound();

  const [providers, logs] = await Promise.all([
    getEmailProviders(profile.organizationId),
    getRecentEmailLogs(profile.organizationId),
  ]);

  const hasProvider = providers.length > 0;

  return (
    <div className="container max-w-4xl py-10">
      <PageHeader
        title="Email provider"
        description="Configure how your organization sends assessment invites, reminders, and notifications"
      />

      {/* Provider config card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {hasProvider ? 'Email provider configuration' : 'Set up your email provider'}
              </CardTitle>
              <CardDescription className="mt-1">
                {hasProvider
                  ? `Currently using ${providers[0]!.provider_type}. You can change providers or update settings below.`
                  : 'Choose a provider to start sending assessment invites and lifecycle emails.'}
              </CardDescription>
            </div>
            {hasProvider && providers[0]!.is_active && (
              <Badge variant="success">Active</Badge>
            )}
            {hasProvider && !providers[0]!.is_active && (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <EmailProviderForm
            existingProvider={
              hasProvider
                ? {
                    id: providers[0]!.id,
                    providerType: providers[0]!.provider_type,
                    fromEmail: providers[0]!.from_email,
                    fromName: providers[0]!.from_name ?? '',
                    replyTo: providers[0]!.reply_to ?? '',
                    smtpHost: providers[0]!.smtp_host ?? '',
                    smtpPort: providers[0]!.smtp_port ?? 587,
                    smtpSecure: providers[0]!.smtp_secure ?? true,
                    smtpUsername: providers[0]!.smtp_username ?? '',
                    providerDomain: providers[0]!.provider_domain ?? '',
                    providerRegion: providers[0]!.provider_region ?? '',
                    isPrimary: providers[0]!.is_primary,
                    isActive: providers[0]!.is_active,
                    lastTestedAt: providers[0]!.last_tested_at,
                    lastTestStatus: providers[0]!.last_test_status,
                    lastTestError: providers[0]!.last_test_error,
                  }
                : null
            }
            userEmail={profile.email}
          />
        </CardContent>
      </Card>

      {/* Email send log */}
      <Card>
        <CardHeader>
          <CardTitle>Send log</CardTitle>
          <CardDescription>
            Last 50 emails sent from your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EmailLogTable logs={logs} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
