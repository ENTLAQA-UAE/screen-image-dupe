import 'server-only';

import { createEmailProvider } from '@/lib/email/factory';
import type {
  EmailMessage,
  EmailProviderConfig,
  EmailProviderType,
  EmailResult,
  EmailTemplateKey,
} from '@/lib/email/types';
import { createAdminClient } from '@/lib/supabase/server';
import { rpc } from '@/lib/supabase/types';

/**
 * High-level email service.
 *
 * Loads the tenant's configured email provider from the database,
 * decrypts credentials, creates the adapter, sends the email, and
 * logs the result.
 *
 * Usage from Server Actions / Route Handlers:
 *   import { sendEmail } from '@/lib/email/service';
 *   await sendEmail(organizationId, {
 *     to: 'user@example.com',
 *     subject: 'Welcome!',
 *     html: '<h1>Hello</h1>',
 *   });
 */

// ==============================================================================
// Load tenant's email provider
// ==============================================================================

async function getTenantEmailProvider(
  organizationId: string,
): Promise<EmailProviderConfig | null> {
  const supabase = createAdminClient();

  // Get the primary provider for this org
  const { data, error } = await supabase
    .from('tenant_email_providers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_primary', true)
    .maybeSingle();

  if (error || !data) {
    // Fall back to any active provider
    const { data: fallback } = await supabase
      .from('tenant_email_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!fallback) return null;
    return await mapProviderRow(fallback, supabase);
  }

  return await mapProviderRow(data, supabase);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mapProviderRow(row: any, supabase: any): Promise<EmailProviderConfig> {
  // Decrypt the API key if present
  let apiKey: string | undefined;
  if (row.encrypted_api_key) {
    // Use the vault decrypt function from Phase 1
    const { data: decrypted } = await rpc(
      supabase,
      'get_decrypted_resend_api_key', // This function works for any encrypted value
      { p_org_id: row.organization_id },
    );
    apiKey = decrypted as string | undefined;
  }

  // Decrypt SMTP password if present
  let smtpPassword: string | undefined;
  if (row.encrypted_smtp_password) {
    // For SMTP, we'd need a separate decrypt function or generalize the existing one
    // For now, use the same pattern
    smtpPassword = undefined; // TODO: add a generic decrypt RPC
  }

  return {
    providerType: row.provider_type as EmailProviderType,
    apiKey,
    fromEmail: row.from_email,
    fromName: row.from_name,
    replyTo: row.reply_to,
    smtpHost: row.smtp_host,
    smtpPort: row.smtp_port,
    smtpSecure: row.smtp_secure,
    smtpUsername: row.smtp_username,
    smtpPassword,
    domain: row.provider_domain,
    region: row.provider_region,
  };
}

// ==============================================================================
// Send email through tenant's provider
// ==============================================================================

export async function sendEmail(
  organizationId: string,
  message: Omit<EmailMessage, 'from' | 'fromName'> & {
    from?: string;
    fromName?: string;
  },
  templateKey?: EmailTemplateKey,
): Promise<EmailResult> {
  const supabase = createAdminClient();

  const providerConfig = await getTenantEmailProvider(organizationId);
  if (!providerConfig) {
    // Log the failure
    await supabase.from('tenant_email_logs').insert({
      organization_id: organizationId,
      to_email: Array.isArray(message.to) ? message.to[0] : message.to,
      from_email: message.from ?? 'noreply@qudurat.com',
      subject: message.subject,
      template_key: templateKey,
      status: 'failed',
      error_message: 'No email provider configured for this organization',
    });

    return {
      success: false,
      error: 'No email provider configured. Go to Settings → Email to set one up.',
    };
  }

  try {
    const adapter = await createEmailProvider(providerConfig);

    const fullMessage: EmailMessage = {
      ...message,
      from: message.from ?? providerConfig.fromEmail,
      fromName: message.fromName ?? providerConfig.fromName,
    };

    const result = await adapter.send(fullMessage);

    // Log the result
    await supabase.from('tenant_email_logs').insert({
      organization_id: organizationId,
      to_email: Array.isArray(message.to) ? message.to[0] : message.to,
      from_email: fullMessage.from,
      subject: message.subject,
      template_key: templateKey,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      provider_message_id: result.messageId,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    return result;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown email error';

    await supabase.from('tenant_email_logs').insert({
      organization_id: organizationId,
      to_email: Array.isArray(message.to) ? message.to[0] : message.to,
      from_email: message.from ?? providerConfig.fromEmail,
      subject: message.subject,
      template_key: templateKey,
      status: 'failed',
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// ==============================================================================
// Test email provider connection
// ==============================================================================

export async function testEmailProvider(
  organizationId: string,
  providerId: string,
  testEmail: string,
): Promise<EmailResult> {
  const result = await sendEmail(
    organizationId,
    {
      to: testEmail,
      subject: 'Qudurat — Test email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Email provider test</h1>
          <p>If you're reading this, your email provider is configured correctly.</p>
          <p style="color: #6b7280; font-size: 14px;">
            Sent at ${new Date().toISOString()} from Qudurat.
          </p>
        </div>
      `,
      text: 'If you\'re reading this, your email provider is configured correctly.',
    },
    undefined,
  );

  // Update the provider's test status
  const supabase = createAdminClient();
  await supabase
    .from('tenant_email_providers')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: result.success ? 'success' : 'failed',
      last_test_error: result.error ?? null,
    })
    .eq('id', providerId)
    .eq('organization_id', organizationId);

  return result;
}
