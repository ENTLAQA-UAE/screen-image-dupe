import { type NextRequest, NextResponse } from 'next/server';

import { getActiveStripeCredentials } from '@/lib/domain/billing-queries';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Stripe webhook handler.
 *
 * Listens for subscription lifecycle events and updates the local
 * `subscriptions` and `invoices` tables accordingly.
 *
 * IMPORTANT: This handler does NOT trust the event until it verifies the
 * signature using the webhook secret (retrieved from payment_providers).
 *
 * Events handled:
 *   - checkout.session.completed → create/upsert subscription
 *   - customer.subscription.updated → sync plan, status, period
 *   - customer.subscription.deleted → mark as canceled
 *   - invoice.paid → record paid invoice
 *   - invoice.payment_failed → mark subscription past_due
 *
 * TODO: Install `stripe` package and wire up signature verification.
 * For now, this is a scaffold that documents the contract.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const credentials = await getActiveStripeCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  // ============================================================================
  // PLACEHOLDER: Real implementation requires the `stripe` npm package.
  // Install with: npm install stripe
  // ============================================================================
  //
  // import Stripe from 'stripe';
  // const stripe = new Stripe(credentials.apiKey, { apiVersion: '2024-06-20' });
  //
  // let event: Stripe.Event;
  // try {
  //   event = stripe.webhooks.constructEvent(
  //     rawBody,
  //     signature,
  //     credentials.webhookSecret,
  //   );
  // } catch (err) {
  //   console.error('Webhook signature verification failed:', err);
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  // }
  //
  // const supabase = createAdminClient();
  //
  // switch (event.type) {
  //   case 'checkout.session.completed': {
  //     const session = event.data.object as Stripe.Checkout.Session;
  //     const orgId = session.client_reference_id;
  //     const planId = session.metadata?.plan_id;
  //     const subscriptionId = session.subscription as string;
  //     const customerId = session.customer as string;
  //
  //     if (!orgId || !planId) break;
  //
  //     // Fetch the full subscription to get period dates
  //     const sub = await stripe.subscriptions.retrieve(subscriptionId);
  //
  //     await supabase.from('subscriptions').upsert(
  //       {
  //         organization_id: orgId,
  //         plan_id: planId,
  //         status: 'active',
  //         billing_cycle: sub.items.data[0].plan.interval === 'year' ? 'annual' : 'monthly',
  //         current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
  //         current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  //         payment_method: 'stripe',
  //         stripe_customer_id: customerId,
  //         stripe_subscription_id: subscriptionId,
  //         trial_end: null,
  //       },
  //       { onConflict: 'organization_id' },
  //     );
  //     break;
  //   }
  //
  //   case 'customer.subscription.updated': {
  //     const sub = event.data.object as Stripe.Subscription;
  //     await supabase
  //       .from('subscriptions')
  //       .update({
  //         status: sub.status === 'active' ? 'active'
  //           : sub.status === 'past_due' ? 'past_due'
  //           : sub.status === 'canceled' ? 'canceled'
  //           : 'paused',
  //         current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
  //         current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  //         cancel_at_period_end: sub.cancel_at_period_end,
  //       })
  //       .eq('stripe_subscription_id', sub.id);
  //     break;
  //   }
  //
  //   case 'customer.subscription.deleted': {
  //     const sub = event.data.object as Stripe.Subscription;
  //     await supabase
  //       .from('subscriptions')
  //       .update({
  //         status: 'canceled',
  //         canceled_at: new Date().toISOString(),
  //       })
  //       .eq('stripe_subscription_id', sub.id);
  //     break;
  //   }
  //
  //   case 'invoice.paid': {
  //     const invoice = event.data.object as Stripe.Invoice;
  //     const { data: sub } = await supabase
  //       .from('subscriptions')
  //       .select('id, organization_id')
  //       .eq('stripe_subscription_id', invoice.subscription as string)
  //       .maybeSingle();
  //
  //     if (sub) {
  //       await supabase.from('invoices').insert({
  //         organization_id: (sub as { organization_id: string }).organization_id,
  //         subscription_id: (sub as { id: string }).id,
  //         amount_usd: invoice.amount_paid / 100,
  //         currency: invoice.currency.toUpperCase(),
  //         tax_amount: (invoice.tax ?? 0) / 100,
  //         status: 'paid',
  //         payment_method: 'stripe',
  //         stripe_invoice_id: invoice.id,
  //         stripe_hosted_url: invoice.hosted_invoice_url,
  //         pdf_url: invoice.invoice_pdf,
  //         paid_at: invoice.status_transitions.paid_at
  //           ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
  //           : new Date().toISOString(),
  //         period_start: new Date(invoice.period_start * 1000).toISOString(),
  //         period_end: new Date(invoice.period_end * 1000).toISOString(),
  //       });
  //     }
  //     break;
  //   }
  //
  //   case 'invoice.payment_failed': {
  //     const invoice = event.data.object as Stripe.Invoice;
  //     await supabase
  //       .from('subscriptions')
  //       .update({ status: 'past_due' })
  //       .eq('stripe_subscription_id', invoice.subscription as string);
  //     // TODO: send payment_failed email to org admin
  //     break;
  //   }
  // }
  // ============================================================================

  // Placeholder response while stripe SDK is not yet installed
  console.warn('[stripe-webhook] Received webhook but SDK not installed yet', {
    bodyLength: rawBody.length,
    signaturePrefix: signature.slice(0, 20),
  });

  return NextResponse.json({ received: true, handled: false });
}

export const runtime = 'nodejs'; // Stripe SDK needs Node runtime, not edge
