'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * Super admin billing Server Actions.
 * - Configure Stripe credentials (stored encrypted)
 * - Configure bank transfer details
 * - Manually activate a subscription for a specific org
 * - Approve/reject bank transfer requests
 */

// ==============================================================================
// Configure Stripe (super admin only)
// ==============================================================================

const stripeConfigSchema = z.object({
  apiKey: z.string().trim().min(10, 'API key is required'),
  webhookSecret: z.string().trim().min(10, 'Webhook secret is required'),
  publishableKey: z.string().trim().min(10, 'Publishable key is required'),
  accountId: z.string().trim().optional().nullable(),
  isTestMode: z.boolean(),
  isActive: z.boolean(),
});

export type ProviderConfigResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function configureStripeAction(
  _prev: ProviderConfigResult | null,
  formData: FormData,
): Promise<ProviderConfigResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isSuperAdmin) {
    return { ok: false, errors: {}, message: 'Super admin access required' };
  }

  const parsed = stripeConfigSchema.safeParse({
    apiKey: formData.get('apiKey'),
    webhookSecret: formData.get('webhookSecret'),
    publishableKey: formData.get('publishableKey'),
    accountId: formData.get('accountId') || null,
    isTestMode: formData.get('isTestMode') === 'on',
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

  // Encrypt secrets via the vault helper (defined in earlier migration).
  // Cast to `any` because the auto-generated Supabase types don't include
  // custom RPC functions until you regenerate them with `supabase gen types`.
  const { data: encryptedKey, error: encErr1 } = await supabase.rpc(
    'encrypt_email_secret',
    { plain_text: parsed.data.apiKey },
  );
  const { data: encryptedWebhook, error: encErr2 } = await supabase.rpc(
    'encrypt_email_secret',
    { plain_text: parsed.data.webhookSecret },
  );

  if (encErr1 || encErr2) {
    return {
      ok: false,
      errors: {},
      message: 'Failed to encrypt credentials. Vault may not be configured.',
    };
  }

  const { error } = await supabase
    .from('payment_providers')
    .upsert(
      {
        provider_type: 'stripe',
        api_key_encrypted: encryptedKey,
        webhook_secret_encrypted: encryptedWebhook,
        publishable_key: parsed.data.publishableKey,
        account_id: parsed.data.accountId,
        is_test_mode: parsed.data.isTestMode,
        is_active: parsed.data.isActive,
        activated_at: parsed.data.isActive ? new Date().toISOString() : null,
        activated_by: parsed.data.isActive ? profile.id : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider_type' },
    );

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  revalidatePath('/[locale]/(admin)/admin/billing/providers', 'page');
  return { ok: true };
}

// ==============================================================================
// Configure bank transfer details (super admin only)
// ==============================================================================

const bankConfigSchema = z.object({
  bankName: z.string().trim().min(2).max(200),
  bankAccountName: z.string().trim().min(2).max(200),
  bankAccountNumber: z.string().trim().min(5).max(50),
  bankIban: z.string().trim().max(50).optional().nullable(),
  bankSwift: z.string().trim().max(20).optional().nullable(),
  bankCurrency: z.string().trim().length(3),
  bankInstructions: z.string().trim().max(2000).optional().nullable(),
  bankInstructionsAr: z.string().trim().max(2000).optional().nullable(),
  isActive: z.boolean(),
});

export async function configureBankTransferAction(
  _prev: ProviderConfigResult | null,
  formData: FormData,
): Promise<ProviderConfigResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isSuperAdmin) {
    return { ok: false, errors: {}, message: 'Super admin access required' };
  }

  const parsed = bankConfigSchema.safeParse({
    bankName: formData.get('bankName'),
    bankAccountName: formData.get('bankAccountName'),
    bankAccountNumber: formData.get('bankAccountNumber'),
    bankIban: formData.get('bankIban') || null,
    bankSwift: formData.get('bankSwift') || null,
    bankCurrency: formData.get('bankCurrency'),
    bankInstructions: formData.get('bankInstructions') || null,
    bankInstructionsAr: formData.get('bankInstructionsAr') || null,
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
  const { error } = await supabase
    .from('payment_providers')
    .upsert(
      {
        provider_type: 'bank_transfer',
        display_name: 'Bank Transfer',
        bank_name: parsed.data.bankName,
        bank_account_name: parsed.data.bankAccountName,
        bank_account_number: parsed.data.bankAccountNumber,
        bank_iban: parsed.data.bankIban,
        bank_swift: parsed.data.bankSwift,
        bank_currency: parsed.data.bankCurrency,
        bank_instructions: parsed.data.bankInstructions,
        bank_instructions_ar: parsed.data.bankInstructionsAr,
        is_active: parsed.data.isActive,
        activated_at: parsed.data.isActive ? new Date().toISOString() : null,
        activated_by: parsed.data.isActive ? profile.id : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider_type' },
    );

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  revalidatePath('/[locale]/(admin)/admin/billing/providers', 'page');
  return { ok: true };
}

// ==============================================================================
// Manually activate a subscription (for bank transfer / complimentary / enterprise)
// ==============================================================================

const manualActivationSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'annual']),
  paymentMethod: z.enum(['bank_transfer', 'invoice', 'complimentary']),
  durationMonths: z.coerce.number().int().min(1).max(60),
  bankTransferReference: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  bankTransferRequestId: z.string().uuid().optional().nullable(),
});

export type ManualActivationResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function activateSubscriptionManuallyAction(
  _prev: ManualActivationResult | null,
  formData: FormData,
): Promise<ManualActivationResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isSuperAdmin) {
    return { ok: false, errors: {}, message: 'Super admin access required' };
  }

  const parsed = manualActivationSchema.safeParse({
    organizationId: formData.get('organizationId'),
    planId: formData.get('planId'),
    billingCycle: formData.get('billingCycle'),
    paymentMethod: formData.get('paymentMethod'),
    durationMonths: formData.get('durationMonths'),
    bankTransferReference: formData.get('bankTransferReference') || null,
    notes: formData.get('notes') || null,
    bankTransferRequestId: formData.get('bankTransferRequestId') || null,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = createAdminClient();

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + parsed.data.durationMonths);

  // Upsert the subscription (one per organization)
  const { data: subscription, error: subErr } = await supabase
    .from('subscriptions')
    .upsert(
      {
        organization_id: parsed.data.organizationId,
        plan_id: parsed.data.planId,
        status: 'active',
        billing_cycle: parsed.data.billingCycle,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        cancel_at_period_end: false,
        canceled_at: null,
        payment_method: parsed.data.paymentMethod,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        manually_activated_by: profile.id,
        manually_activated_at: new Date().toISOString(),
        manual_activation_notes: parsed.data.notes,
        bank_transfer_reference: parsed.data.bankTransferReference,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' },
    )
    .select('id')
    .single();

  if (subErr || !subscription) {
    return {
      ok: false,
      errors: {},
      message: subErr?.message ?? 'Failed to activate subscription',
    };
  }

  const subId = (subscription as { id: string }).id;

  // Create a paid invoice record
  const { data: plan } = await supabase
    .from('plans')
    .select('price_monthly_usd, price_annual_usd')
    .eq('id', parsed.data.planId)
    .single();

  const amount =
    parsed.data.paymentMethod === 'complimentary'
      ? 0
      : parsed.data.billingCycle === 'annual'
        ? ((plan as { price_annual_usd: number | null } | null)
            ?.price_annual_usd ?? 0)
        : ((plan as { price_monthly_usd: number | null } | null)
            ?.price_monthly_usd ?? 0) * parsed.data.durationMonths;

  await supabase.from('invoices').insert({
    organization_id: parsed.data.organizationId,
    subscription_id: subId,
    amount_usd: amount,
    currency: 'USD',
    tax_amount: 0,
    status: 'paid',
    payment_method: parsed.data.paymentMethod,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    paid_at: new Date().toISOString(),
    bank_transfer_reference: parsed.data.bankTransferReference,
    bank_transfer_confirmed_at:
      parsed.data.paymentMethod === 'bank_transfer'
        ? new Date().toISOString()
        : null,
    bank_transfer_confirmed_by:
      parsed.data.paymentMethod === 'bank_transfer' ? profile.id : null,
    notes: parsed.data.notes,
  });

  // If this was triggered by a bank transfer request, mark it confirmed
  if (parsed.data.bankTransferRequestId) {
    await supabase
      .from('bank_transfer_requests')
      .update({
        status: 'paid_confirmed',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        activated_subscription_id: subId,
      })
      .eq('id', parsed.data.bankTransferRequestId);
  }

  revalidatePath('/[locale]/(admin)/admin/billing/subscriptions', 'page');
  revalidatePath('/[locale]/(admin)/admin/billing/requests', 'page');
  return { ok: true, subscriptionId: subId };
}

// ==============================================================================
// Reject bank transfer request
// ==============================================================================

export async function rejectBankTransferRequestAction(
  requestId: string,
  reason: string,
): Promise<void> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isSuperAdmin) return;

  const supabase = createAdminClient();
  await supabase
    .from('bank_transfer_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  revalidatePath('/[locale]/(admin)/admin/billing/requests', 'page');
}

// ==============================================================================
// Mark bank transfer request as awaiting payment (proforma sent)
// ==============================================================================

export async function markAwaitingPaymentAction(
  requestId: string,
): Promise<void> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.isSuperAdmin) return;

  const supabase = createAdminClient();
  await supabase
    .from('bank_transfer_requests')
    .update({
      status: 'awaiting_payment',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  revalidatePath('/[locale]/(admin)/admin/billing/requests', 'page');
}
