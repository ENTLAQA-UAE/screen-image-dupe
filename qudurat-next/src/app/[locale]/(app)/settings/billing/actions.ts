'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
  if (!profile || !profile.isOrgAdmin) {
    return { ok: false, message: 'Only organization admins can purchase plans' };
  }

  const parsed = checkoutSchema.safeParse({
    planId: formData.get('planId'),
    billingCycle: formData.get('billingCycle'),
  });
  if (!parsed.success) {
    return { ok: false, message: 'Invalid plan selection' };
  }

  // TODO: Replace with real Stripe SDK call once stripe package is installed.
  //
  // import Stripe from 'stripe';
  // const credentials = await getActiveStripeCredentials();
  // if (!credentials) return { ok: false, message: 'Payment provider not configured' };
  // const stripe = new Stripe(credentials.apiKey, { apiVersion: '2024-06-20' });
  //
  // const plan = await getPlan(parsed.data.planId);
  // const priceId = parsed.data.billingCycle === 'annual'
  //   ? plan.stripe_price_annual_id
  //   : plan.stripe_price_monthly_id;
  //
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   customer_email: profile.email,
  //   client_reference_id: profile.organizationId,
  //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
  //   metadata: { organization_id: profile.organizationId, plan_id: plan.id },
  // });
  //
  // return { ok: true, url: session.url! };

  return {
    ok: false,
    message:
      'Stripe SDK integration pending. Super admin must install `stripe` package and wire up this action.',
  };
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
