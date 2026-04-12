import 'server-only';

import Stripe from 'stripe';

import { getActiveStripeCredentials } from '@/lib/domain/billing-queries';

/**
 * Create a Stripe SDK instance using credentials retrieved from Supabase
 * payment_providers. Throws if Stripe is not configured or not active.
 *
 * Use only from Server Components, Server Actions, or Route Handlers.
 */
export async function getStripeClient(): Promise<Stripe> {
  const credentials = await getActiveStripeCredentials();
  if (!credentials) {
    throw new Error(
      'Stripe is not configured. Super admin must configure it at /admin/billing/providers',
    );
  }
  return new Stripe(credentials.apiKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
    appInfo: {
      name: 'Qudurat',
      version: '0.1.0',
    },
  });
}

/**
 * Verify a Stripe webhook signature and return the typed event.
 * Throws if the signature is invalid.
 */
export async function constructStripeEvent(
  rawBody: string,
  signature: string,
): Promise<Stripe.Event> {
  const credentials = await getActiveStripeCredentials();
  if (!credentials) {
    throw new Error('Stripe webhook not configured');
  }

  const stripe = new Stripe(credentials.apiKey, {
    apiVersion: '2024-12-18.acacia',
  });

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    credentials.webhookSecret,
  );
}
