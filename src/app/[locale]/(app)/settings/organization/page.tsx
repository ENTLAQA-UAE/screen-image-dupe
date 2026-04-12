import { Building2, Globe, Mail, Palette, Shield, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Organization settings',
};

async function getOrganization(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name, language, logo_url, created_at')
    .eq('id', organizationId)
    .maybeSingle();
  return data as {
    id: string;
    name: string;
    language: string;
    logo_url: string | null;
    created_at: string;
  } | null;
}

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);
  if (!profile.isOrgAdmin) notFound();

  const org = await getOrganization(profile.organizationId);
  if (!org) notFound();

  return (
    <div className="container max-w-4xl py-10">
      <PageHeader
        title="Organization settings"
        description="Manage your organization's branding, providers, and access"
      />

      {/* General */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>Basic organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Organization name</Label>
            <Input id="orgName" defaultValue={org.name} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgLang">Default language</Label>
            <Input
              id="orgLang"
              defaultValue={org.language.toUpperCase()}
              disabled
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Organization editing will be enabled in Phase 2 Week 10 alongside
            the full branding system.
          </div>
        </CardContent>
      </Card>

      {/* Module tiles — each links to a dedicated page */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleTile
          icon={Palette}
          title="Branding"
          description="Logo, colors, fonts, and white-label options"
          status="Phase 2 Week 10"
          href="#"
          disabled
        />
        <ModuleTile
          icon={Mail}
          title="Email provider"
          description="Configure Resend, Mailgun, SMTP, or bring your own"
          status="Available"
          href="/settings/email"
        />
        <ModuleTile
          icon={Globe}
          title="Custom domain"
          description="Attach your own domain with auto-SSL"
          status="Phase 2 Week 9"
          href="#"
          disabled
        />
        <ModuleTile
          icon={Users}
          title="Members & roles"
          description="Invite team members and assign roles"
          status="Available"
          href="/settings/members"
        />
        <ModuleTile
          icon={Shield}
          title="Security & audit"
          description="Session management, 2FA policy, audit log"
          status="Phase 3 Week 13"
          href="#"
          disabled
        />
        <ModuleTile
          icon={Building2}
          title="Billing & subscription"
          description="Manage your plan, payment method, and invoices"
          status="Available"
          href="/settings/billing"
        />
      </div>
    </div>
  );
}

function ModuleTile({
  icon: Icon,
  title,
  description,
  status,
  href,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <Card
      className={
        disabled
          ? 'opacity-60'
          : 'cursor-pointer transition-all hover:border-primary/40 hover:shadow-md'
      }
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Icon className="h-5 w-5 text-primary" />
          <Badge
            variant={disabled ? 'outline' : 'success'}
            className="text-[10px]"
          >
            {status}
          </Badge>
        </div>
        <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}
