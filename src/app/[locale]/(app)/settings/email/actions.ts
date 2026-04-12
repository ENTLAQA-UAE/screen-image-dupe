'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { testEmailProvider } from '@/lib/email/service';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';
import { rpc } from '@/lib/supabase/types';

// ==============================================================================
// Save email provider configuration
// ==============================================================================

const providerSchema = z.object({
  providerType: z.enum([
    'resend',
    'mailgun',
    'sendgrid',
    'ses',
    'postmark',
    'smtp',
  ]),
  fromEmail: z.string().trim().email(),
  fromName: z.string().trim().max(100).optional().nullable(),
  replyTo: z.string().trim().email().optional().nullable(),
  apiKey: z.string().trim().min(5).optional().nullable(),
  smtpHost: z.string().trim().optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpSecure: z.boolean().optional(),
  smtpUsername: z.string().trim().optional().nullable(),
  smtpPassword: z.string().trim().optional().nullable(),
  providerDomain: z.string().trim().optional().nullable(),
  providerRegion: z.string().trim().optional().nullable(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

export type SaveProviderResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function saveEmailProviderAction(
  _prev: SaveProviderResult | null,
  formData: FormData,
): Promise<SaveProviderResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId || !profile.isOrgAdmin) {
    return { ok: false, errors: {}, message: 'Org admin access required' };
  }

  const parsed = providerSchema.safeParse({
    providerType: formData.get('providerType'),
    fromEmail: formData.get('fromEmail'),
    fromName: formData.get('fromName') || null,
    replyTo: formData.get('replyTo') || null,
    apiKey: formData.get('apiKey') || null,
    smtpHost: formData.get('smtpHost') || null,
    smtpPort: formData.get('smtpPort') || null,
    smtpSecure: formData.get('smtpSecure') === 'on',
    smtpUsername: formData.get('smtpUsername') || null,
    smtpPassword: formData.get('smtpPassword') || null,
    providerDomain: formData.get('providerDomain') || null,
    providerRegion: formData.get('providerRegion') || null,
    isPrimary: formData.get('isPrimary') === 'on',
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = createAdminClient();

  // Encrypt API key if provided
  let encryptedApiKey = null;
  if (parsed.data.apiKey) {
    const { data: encrypted } = await rpc(supabase, 'encrypt_email_secret', {
      plain_text: parsed.data.apiKey,
    });
    encryptedApiKey = encrypted;
  }

  // Encrypt SMTP password if provided
  let encryptedSmtpPassword = null;
  if (parsed.data.smtpPassword) {
    const { data: encrypted } = await rpc(supabase, 'encrypt_email_secret', {
      plain_text: parsed.data.smtpPassword,
    });
    encryptedSmtpPassword = encrypted;
  }

  const { error } = await supabase
    .from('tenant_email_providers')
    .upsert(
      {
        organization_id: profile.organizationId,
        provider_type: parsed.data.providerType,
        from_email: parsed.data.fromEmail,
        from_name: parsed.data.fromName,
        reply_to: parsed.data.replyTo,
        encrypted_api_key: encryptedApiKey,
        smtp_host: parsed.data.smtpHost,
        smtp_port: parsed.data.smtpPort,
        smtp_secure: parsed.data.smtpSecure,
        smtp_username: parsed.data.smtpUsername,
        encrypted_smtp_password: encryptedSmtpPassword,
        provider_domain: parsed.data.providerDomain,
        provider_region: parsed.data.providerRegion,
        is_primary: parsed.data.isPrimary,
        is_active: parsed.data.isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider_type' },
    );

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  const locale = (formData.get('locale') as string) ?? 'en';
  revalidatePath(`/${locale}/settings/email`);
  return { ok: true };
}

// ==============================================================================
// Test email provider
// ==============================================================================

export type TestResult =
  | { ok: true; messageId?: string }
  | { ok: false; message: string };

export async function testEmailProviderAction(
  providerId: string,
  testEmail: string,
): Promise<TestResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId || !profile.isOrgAdmin) {
    return { ok: false, message: 'Org admin access required' };
  }

  const result = await testEmailProvider(
    profile.organizationId,
    providerId,
    testEmail,
  );

  if (!result.success) {
    return { ok: false, message: result.error ?? 'Test email failed' };
  }

  return { ok: true, messageId: result.messageId };
}

// ==============================================================================
// Delete email provider
// ==============================================================================

export async function deleteEmailProviderAction(
  providerId: string,
): Promise<{ ok: boolean; message?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId || !profile.isOrgAdmin) {
    return { ok: false, message: 'Org admin access required' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('tenant_email_providers')
    .delete()
    .eq('id', providerId)
    .eq('organization_id', profile.organizationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
