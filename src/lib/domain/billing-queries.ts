import 'server-only';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { rpc } from '@/lib/supabase/types';

import type {
  BankTransferRequest,
  Invoice,
  PaymentProvider,
  Plan,
  Subscription,
} from './billing-types';

// ==============================================================================
// Plans
// ==============================================================================

export async function listPublicPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapPlan);
}

export async function listAllPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapPlan);
}

// ==============================================================================
// Subscriptions
// ==============================================================================

export async function getCurrentSubscription(
  organizationId: string,
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans!inner(slug, name)')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapSubscription(data);
}

export async function listAllSubscriptions(): Promise<
  Array<Subscription & { organizationName: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      '*, plans!inner(slug, name), organizations!inner(id, name)',
    )
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as unknown as {
      organizations: { name: string };
    };
    return {
      ...mapSubscription(row),
      organizationName: r.organizations.name,
    };
  });
}

// ==============================================================================
// Invoices
// ==============================================================================

export async function listInvoices(
  organizationId: string,
  limit = 50,
): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map(mapInvoice);
}

// ==============================================================================
// Bank transfer requests
// ==============================================================================

export async function listBankTransferRequests(
  opts: { status?: string; organizationId?: string } = {},
): Promise<BankTransferRequest[]> {
  const supabase = await createClient();
  let query = supabase
    .from('bank_transfer_requests')
    .select('*, plans!inner(slug, name)')
    .order('created_at', { ascending: false });

  if (opts.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }
  if (opts.organizationId) {
    query = query.eq('organization_id', opts.organizationId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map(mapBankTransferRequest);
}

// ==============================================================================
// Payment providers (admin-only)
// ==============================================================================

export async function listPaymentProviders(): Promise<PaymentProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payment_providers')
    .select(
      'id, provider_type, display_name, is_active, is_test_mode, publishable_key, account_id, bank_name, bank_account_name, bank_account_number, bank_iban, bank_swift, bank_currency, bank_instructions, bank_instructions_ar, activated_at, updated_at, api_key_encrypted, webhook_secret_encrypted',
    )
    .order('provider_type');

  if (error) return [];
  return (data ?? []).map(mapPaymentProvider);
}

/**
 * Get the active Stripe provider credentials (for server-side use only).
 * Uses admin client to decrypt secrets via RPC.
 */
export async function getActiveStripeCredentials(): Promise<{
  apiKey: string;
  webhookSecret: string;
  publishableKey: string;
} | null> {
  const supabase = createAdminClient();
  const { data } = await rpc(supabase, 'get_stripe_credentials');
  if (!data) return null;
  return data as {
    apiKey: string;
    webhookSecret: string;
    publishableKey: string;
  };
}

export async function getActiveBankProvider(): Promise<PaymentProvider | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payment_providers')
    .select(
      'id, provider_type, display_name, is_active, is_test_mode, publishable_key, account_id, bank_name, bank_account_name, bank_account_number, bank_iban, bank_swift, bank_currency, bank_instructions, bank_instructions_ar, activated_at, updated_at, api_key_encrypted, webhook_secret_encrypted',
    )
    .eq('provider_type', 'bank_transfer')
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapPaymentProvider(data);
}

// ==============================================================================
// Mappers
// ==============================================================================

function mapPlan(row: unknown): Plan {
  const r = row as {
    id: string;
    slug: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    description_ar: string | null;
    price_monthly_usd: number | null;
    price_annual_usd: number | null;
    currency: string;
    max_assessments: number;
    max_groups: number;
    max_users: number;
    max_organizations: number;
    max_ai_questions_monthly: number;
    features: Record<string, unknown>;
    is_active: boolean;
    is_public: boolean;
    sort_order: number;
  };
  return {
    id: r.id,
    slug: r.slug as Plan['slug'],
    name: r.name,
    nameAr: r.name_ar,
    description: r.description,
    descriptionAr: r.description_ar,
    priceMonthlyUsd: r.price_monthly_usd,
    priceAnnualUsd: r.price_annual_usd,
    currency: r.currency,
    maxAssessments: r.max_assessments,
    maxGroups: r.max_groups,
    maxUsers: r.max_users,
    maxOrganizations: r.max_organizations,
    maxAiQuestionsMonthly: r.max_ai_questions_monthly,
    features: r.features ?? {},
    isActive: r.is_active,
    isPublic: r.is_public,
    sortOrder: r.sort_order,
  };
}

function mapSubscription(row: unknown): Subscription {
  const r = row as {
    id: string;
    organization_id: string;
    plan_id: string;
    plans: { slug: string; name: string };
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    payment_method: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    manually_activated_by: string | null;
    manually_activated_at: string | null;
    manual_activation_notes: string | null;
    bank_transfer_reference: string | null;
    created_at: string;
    updated_at: string;
  };
  return {
    id: r.id,
    organizationId: r.organization_id,
    planId: r.plan_id,
    planSlug: r.plans.slug as Subscription['planSlug'],
    planName: r.plans.name,
    status: r.status as Subscription['status'],
    billingCycle: r.billing_cycle as Subscription['billingCycle'],
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    trialEnd: r.trial_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    canceledAt: r.canceled_at,
    paymentMethod: r.payment_method as Subscription['paymentMethod'],
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    manuallyActivatedBy: r.manually_activated_by,
    manuallyActivatedAt: r.manually_activated_at,
    manualActivationNotes: r.manual_activation_notes,
    bankTransferReference: r.bank_transfer_reference,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapInvoice(row: unknown): Invoice {
  const r = row as {
    id: string;
    organization_id: string;
    subscription_id: string | null;
    invoice_number: string;
    amount_usd: number;
    currency: string;
    tax_amount: number;
    status: string;
    payment_method: string;
    stripe_invoice_id: string | null;
    stripe_hosted_url: string | null;
    pdf_url: string | null;
    period_start: string | null;
    period_end: string | null;
    due_date: string | null;
    paid_at: string | null;
    bank_transfer_reference: string | null;
    notes: string | null;
    created_at: string;
  };
  return {
    id: r.id,
    organizationId: r.organization_id,
    subscriptionId: r.subscription_id,
    invoiceNumber: r.invoice_number,
    amountUsd: r.amount_usd,
    currency: r.currency,
    taxAmount: r.tax_amount,
    status: r.status as Invoice['status'],
    paymentMethod: r.payment_method as Invoice['paymentMethod'],
    stripeInvoiceId: r.stripe_invoice_id,
    stripeHostedUrl: r.stripe_hosted_url,
    pdfUrl: r.pdf_url,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    dueDate: r.due_date,
    paidAt: r.paid_at,
    bankTransferReference: r.bank_transfer_reference,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapBankTransferRequest(row: unknown): BankTransferRequest {
  const r = row as {
    id: string;
    organization_id: string;
    requested_by: string;
    plan_id: string;
    plans: { slug: string; name: string };
    billing_cycle: string;
    amount_usd: number;
    company_name: string;
    company_vat_number: string | null;
    billing_email: string;
    billing_address: string | null;
    notes: string | null;
    status: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    proforma_invoice_id: string | null;
    activated_subscription_id: string | null;
    created_at: string;
  };
  return {
    id: r.id,
    organizationId: r.organization_id,
    requestedBy: r.requested_by,
    planId: r.plan_id,
    planSlug: r.plans.slug as BankTransferRequest['planSlug'],
    planName: r.plans.name,
    billingCycle: r.billing_cycle as BankTransferRequest['billingCycle'],
    amountUsd: r.amount_usd,
    companyName: r.company_name,
    companyVatNumber: r.company_vat_number,
    billingEmail: r.billing_email,
    billingAddress: r.billing_address,
    notes: r.notes,
    status: r.status as BankTransferRequest['status'],
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    rejectionReason: r.rejection_reason,
    proformaInvoiceId: r.proforma_invoice_id,
    activatedSubscriptionId: r.activated_subscription_id,
    createdAt: r.created_at,
  };
}

function mapPaymentProvider(row: unknown): PaymentProvider {
  const r = row as {
    id: string;
    provider_type: string;
    display_name: string | null;
    is_active: boolean;
    is_test_mode: boolean;
    publishable_key: string | null;
    account_id: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_iban: string | null;
    bank_swift: string | null;
    bank_currency: string | null;
    bank_instructions: string | null;
    bank_instructions_ar: string | null;
    activated_at: string | null;
    updated_at: string;
    api_key_encrypted: unknown;
    webhook_secret_encrypted: unknown;
  };
  return {
    id: r.id,
    providerType: r.provider_type as PaymentProvider['providerType'],
    displayName: r.display_name,
    isActive: r.is_active,
    isTestMode: r.is_test_mode,
    publishableKey: r.publishable_key,
    hasApiKey: r.api_key_encrypted !== null,
    hasWebhookSecret: r.webhook_secret_encrypted !== null,
    accountId: r.account_id,
    bankName: r.bank_name,
    bankAccountName: r.bank_account_name,
    bankAccountNumber: r.bank_account_number,
    bankIban: r.bank_iban,
    bankSwift: r.bank_swift,
    bankCurrency: r.bank_currency,
    bankInstructions: r.bank_instructions,
    bankInstructionsAr: r.bank_instructions_ar,
    activatedAt: r.activated_at,
    updatedAt: r.updated_at,
  };
}
