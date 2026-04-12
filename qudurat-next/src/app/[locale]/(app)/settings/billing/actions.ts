'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getStripeClient } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * Customer-facing billing Server Actions.
 * - Request a Stripe checkout session
 * - Submit a bank transfer request (for enterprise / offline payment)
 */

// ==============================================================================
// Stripe checkout session (customer-initiated)
// ==============================================================================

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'annual']),
});

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function createCheckoutSessionAction(
  _prev: CheckoutResult | null,
  formData: FormData,
): Promise<CheckoutResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId || !profile.isOrgAdmin) {
    return {
      ok: false,
      message: 'Only organization admins can purchase plans',
    };
  }

  const parsed = checkoutSchema.safeParse({
    planId: formData.get('planId'),
    billingCycle: formData.get('billingCycle'),
  });
  if (!parsed.success) {
    return { ok: false, message: 'Invalid plan selection' };
  }

  const supabase = createAdminClient();
  const { data: plan } = await supabase
    .from('plans')
    .select(
      'id, slug, stripe_price_monthly_id, stripe_price_annual_id, price_monthly_usd, price_annual_usd',
    )
    .eq('id', parsed.data.planId)
    .maybeSingle();

  if (!plan) {
    return { ok: false, message: 'Plan not found' };
  }

  const typedPlan = plan as {
    id: string;
    slug: string;
    stripe_price_monthly_id: string | null;
    stripe_price_annual_id: string | null;
  };

  const priceId =
    parsed.data.billingCycle === 'annual'
      ? typedPlan.stripe_price_annual_id
      : typedPlan.stripe_price_monthly_id;

  if (!priceId) {
    return {
      ok: false,
      message: `Stripe price ID not configured for ${typedPlan.slug}. Super admin must set stripe_price_*_id on the plan.`,
    };
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', profile.organizationId)
    .maybeSingle();

  const existingCustomerId =
    (existingSub as { stripe_customer_id: string | null } | null)
      ?.stripe_customer_id ?? undefined;

  let stripe;
  try {
    stripe = await getStripeClient();
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Stripe is not configured',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const locale = (formData.get('locale') as string) ?? 'en';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : profile.email,
      client_reference_id: profile.organizationId,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      success_url: `${appUrl}/${locale}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/settings/billing?canceled=true`,
      metadata: {
        organization_id: profile.organizationId,
        plan_id: typedPlan.id,
        plan_slug: typedPlan.slug,
        billing_cycle: parsed.data.billingCycle,
        created_by: profile.id,
      },
      subscription_data: {
        metadata: {
          organization_id: profile.organizationId,
          plan_id: typedPlan.id,
        },
      },
    });

    if (!session.url) {
      return { ok: false, message: 'Stripe did not return a checkout URL' };
    }

    revalidatePath(`/${locale}/settings/billing`);
    return { ok: true, url: session.url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to create checkout session';
    console.error('[createCheckoutSession]', message);
    return { ok: false, message };
  }
}

// ==============================================================================
// Bank transfer request (customer-initiated, admin-processed)
// ==============================================================================

const bankTransferRequestSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'annual']),
  companyName: z.string().trim().min(2).max(200),
  companyVatNumber: z.string().trim().max(50).optional().nullable(),
  billingEmail: z.string().trim().email(),
  billingAddress: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type BankTransferRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function requestBankTransferAction(
  _prev: BankTransferRequestResult | null,
  formData: FormData,
): Promise<BankTransferRequestResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId || !profile.isOrgAdmin) {
    return {
      ok: false,
      errors: {},
      message: 'Only organization admins can request bank transfer billing',
    };
  }

  const parsed = bankTransferRequestSchema.safeParse({
    planId: formData.get('planId'),
    billingCycle: formData.get('billingCycle'),
    companyName: formData.get('companyName'),
    companyVatNumber: formData.get('companyVatNumber') || null,
    billingEmail: formData.get('billingEmail'),
    billingAddress: formData.get('billingAddress') || null,
    notes: formData.get('notes') || null,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  // Admin client to fetch plan pricing (plans are public but this avoids RLS overhead)
  const supabase = createAdminClient();

  const { data: plan } = await supabase
    .from('plans')
    .select('price_monthly_usd, price_annual_usd, slug')
    .eq('id', parsed.data.planId)
    .maybeSingle();

  if (!plan) {
    return { ok: false, errors: {}, message: 'Invalid plan' };
  }

  const typedPlan = plan as unknown as {
    price_monthly_usd: number | null;
    price_annual_usd: number | null;
    slug: string;
  };

  const amount =
    parsed.data.billingCycle === 'annual'
      ? typedPlan.price_annual_usd
      : typedPlan.price_monthly_usd;

  if (amount === null) {
    return {
      ok: false,
      errors: {},
      message: `${typedPlan.slug} requires a custom quote — please contact sales`,
    };
  }

  const { data: request, error } = await supabase
    .from('bank_transfer_requests')
    .insert({
      organization_id: profile.organizationId,
      requested_by: profile.id,
      plan_id: parsed.data.planId,
      billing_cycle: parsed.data.billingCycle,
      amount_usd: amount,
      company_name: parsed.data.companyName,
      company_vat_number: parsed.data.companyVatNumber,
      billing_email: parsed.data.billingEmail,
      billing_address: parsed.data.billingAddress,
      notes: parsed.data.notes,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !request) {
    return {
      ok: false,
      errors: {},
      message: error?.message ?? 'Failed to submit request',
    };
  }

  // TODO: email super admins about the new request

  revalidatePath('/[locale]/(app)/settings/billing', 'page');
  return { ok: true, requestId: (request as { id: string }).id };
}

// ==============================================================================
// Cancel subscription
// ==============================================================================

export async function cancelSubscriptionAction(locale: string = 'en'): Promise<void> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId || !profile.isOrgAdmin) return;

  const supabase = createAdminClient();
  await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    })
    .eq('organization_id', profile.organizationId);

  revalidatePath(`/${locale}/settings/billing`);
}
