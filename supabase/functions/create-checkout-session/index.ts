import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client for privileged DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user via anon client with forwarded auth header
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { planId, billingCycle, successUrl, cancelUrl } = await req.json();

    if (!planId || !billingCycle) {
      return new Response(
        JSON.stringify({ error: "planId and billingCycle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "User has no organization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan with Stripe price IDs
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, stripe_product_id, stripe_price_monthly_id, stripe_price_annual_id, price_monthly_usd, price_annual_usd")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the correct Stripe price ID (optional — can use inline price_data)
    const stripePriceId = billingCycle === "annual"
      ? plan.stripe_price_annual_id
      : plan.stripe_price_monthly_id;

    // Calculate price in cents for inline pricing
    const priceUsd = billingCycle === "annual" ? plan.price_annual_usd : plan.price_monthly_usd;

    if (!stripePriceId && (!priceUsd || priceUsd <= 0)) {
      return new Response(
        JSON.stringify({ error: "No price configured for this plan and billing cycle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Stripe API key from payment_providers
    const { data: provider } = await supabase
      .from("payment_providers")
      .select("api_key_encrypted")
      .eq("provider_type", "stripe")
      .eq("is_active", true)
      .single();

    if (!provider?.api_key_encrypted) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Contact your administrator." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(provider.api_key_encrypted, {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;

    // Get org name for customer
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org?.name || undefined,
        metadata: {
          organization_id: profile.organization_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("organization_id", profile.organization_id);
    }

    // Build line item — use existing Stripe Price ID if available, otherwise inline price_data
    const lineItem = stripePriceId
      ? { price: stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.slug,
            },
            unit_amount: Math.round(priceUsd! * 100),
            recurring: {
              interval: billingCycle === "annual" ? "year" as const : "month" as const,
            },
          },
          quantity: 1,
        };

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [lineItem],
      success_url: successUrl || `${req.headers.get("origin")}/subscription?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/subscription?checkout=cancel`,
      subscription_data: {
        metadata: {
          organization_id: profile.organization_id,
          plan_id: planId,
          plan_slug: plan.slug,
          billing_cycle: billingCycle,
        },
      },
      metadata: {
        organization_id: profile.organization_id,
        plan_id: planId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
