/**
 * Stripe.js loader — loads Stripe from their CDN.
 * Reads the publishable key from the payment_providers table at runtime,
 * so no env vars are needed on the client side.
 */

import { supabase } from '@/integrations/supabase/client';

let stripePromise: Promise<any> | null = null;
let cachedPublishableKey: string | null = null;

/** Load the Stripe.js script from CDN */
function loadStripeScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve((window as any).Stripe);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve((window as any).Stripe);
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });
}

/** Get the publishable key from payment_providers table */
async function getPublishableKey(): Promise<string | null> {
  if (cachedPublishableKey) return cachedPublishableKey;

  const { data, error } = await supabase
    .from('payment_providers')
    .select('publishable_key')
    .eq('provider', 'stripe')
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.publishable_key) return null;
  cachedPublishableKey = data.publishable_key;
  return cachedPublishableKey;
}

/** Get an initialized Stripe instance. Returns null if not configured. */
export async function getStripe(): Promise<any | null> {
  if (stripePromise) return stripePromise;

  const publishableKey = await getPublishableKey();
  if (!publishableKey) return null;

  stripePromise = loadStripeScript().then((Stripe) => Stripe(publishableKey));
  return stripePromise;
}

/** Check if Stripe is configured (has a publishable key) */
export async function isStripeConfigured(): Promise<boolean> {
  const key = await getPublishableKey();
  return !!key;
}
