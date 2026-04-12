import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { constructStripeEvent } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Stripe webhook handler.
 *
 * Verifies the signature against the webhook secret stored in
 * payment_providers (encrypted via Supabase Vault), then dispatches
 * known events to update local subscriptions and invoices.
 *
 * Events handled:
 *   - checkout.session.completed → create/upsert subscription
 *   - customer.subscription.updated → sync plan, status, period
 *   - customer.subscription.deleted → mark as canceled
 *   - invoice.paid → record paid invoice
 *   - invoice.payment_failed → mark subscription past_due
 *
 * Webhook endpoint setup:
 *   1. Super admin configures Stripe at /admin/billing/providers
 *   2. In Stripe Dashboard → Developers → Webhooks, add endpoint:
 *      https://YOUR_DOMAIN/api/webhooks/stripe
 *   3. Select the 5 events above
 *   4. Copy the signing secret back into the admin config
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await constructStripeEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[stripe-webhook] signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        const planId = session.metadata?.plan_id;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;

        if (!orgId || !planId || !subscriptionId || !customerId) {
          console.warn(
            '[stripe-webhook] checkout.session.completed missing required fields',
            { orgId, planId, subscriptionId, customerId },
          );
          break;
        }

        // Retrieve full subscription to get period dates and interval
        // Using the dynamic stripe client is not needed here because the session
        // already contains subscription_details. But for period dates we need it.
        // We use the previously-loaded client.
        // Stripe event includes enough data for most use cases; fall back to
        // a secondary fetch if needed. For simplicity here we use the session
        // fields that are available via the expanded event.

        // Period dates are not on the session object — we need to fetch the
        // subscription to get them. Because we're in a webhook handler, we can
        // call Stripe directly.
        const { getStripeClient } = await import('@/lib/stripe/server');
        const stripe = await getStripeClient();
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const interval = sub.items.data[0]?.plan.interval;
        const billingCycle = interval === 'year' ? 'annual' : 'monthly';

        await supabase.from('subscriptions').upsert(
          {
            organization_id: orgId,
            plan_id: planId,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: new Date(
              sub.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000,
            ).toISOString(),
            payment_method: 'stripe',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            trial_end: null,
            cancel_at_period_end: false,
            canceled_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' },
        );
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const mappedStatus = mapStripeStatus(sub.status);
        await supabase
          .from('subscriptions')
          .update({
            status: mappedStatus,
            current_period_start: new Date(
              sub.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000,
            ).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        if (!subscriptionId) break;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, organization_id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (!sub) {
          console.warn(
            '[stripe-webhook] invoice.paid for unknown subscription:',
            subscriptionId,
          );
          break;
        }

        const typedSub = sub as { id: string; organization_id: string };

        await supabase.from('invoices').insert({
          organization_id: typedSub.organization_id,
          subscription_id: typedSub.id,
          amount_usd: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          tax_amount: (invoice.tax ?? 0) / 100,
          status: 'paid',
          payment_method: 'stripe',
          stripe_invoice_id: invoice.id,
          stripe_hosted_url: invoice.hosted_invoice_url,
          pdf_url: invoice.invoice_pdf,
          paid_at: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : new Date().toISOString(),
          period_start: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : null,
          period_end: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        if (!subscriptionId) break;

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        // TODO: trigger payment_failed lifecycle email via Phase 2 Week 7 email system
        break;
      }

      default:
        // Ignore other events
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] error processing event', event.type, err);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true, type: event.type });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    case 'paused':
      return 'paused';
    case 'trialing':
      return 'trialing';
    case 'incomplete':
    default:
      return 'past_due';
  }
}

export const runtime = 'nodejs';
