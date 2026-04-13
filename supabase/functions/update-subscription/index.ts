import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Update an existing Stripe subscription (upgrade/downgrade).
 * - Upgrades: prorated, applied immediately
 * - Downgrades: applied at end of current billing period
 */
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

    const { planId, billingCycle } = await req.json();

    if (!planId) {
      return new Response(
        JSON.stringify({ error: "planId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's org
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

    // Get current subscription with Stripe ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, plan_id")
      .eq("organization_id", profile.organization_id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No active Stripe subscription found. Use checkout for new subscriptions." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target plan
    const { data: targetPlan } = await supabase
      .from("plans")
      .select("id, name, slug, stripe_price_monthly_id, stripe_price_annual_id, price_monthly_usd, price_annual_usd, sort_order")
      .eq("id", planId)
      .single();

    if (!targetPlan) {
      return new Response(
        JSON.stringify({ error: "Target plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current plan to determine upgrade vs downgrade
    const { data: currentPlan } = await supabase
      .from("plans")
      .select("id, sort_order, price_monthly_usd")
      .eq("id", subscription.plan_id)
      .single();

    const cycle = billingCycle || "monthly";
    const newPriceId = cycle === "annual"
      ? targetPlan.stripe_price_annual_id
      : targetPlan.stripe_price_monthly_id;

    if (!newPriceId) {
      return new Response(
        JSON.stringify({ error: "Stripe price not configured for this plan/cycle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Stripe API key
    const { data: provider } = await supabase
      .from("payment_providers")
      .select("api_key_encrypted")
      .eq("provider_type", "stripe")
      .eq("is_active", true)
      .single();

    if (!provider?.api_key_encrypted) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(provider.api_key_encrypted, {
      apiVersion: "2023-10-16",
    });

    // Get current Stripe subscription to find the subscription item
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const subscriptionItemId = stripeSub.items.data[0]?.id;

    if (!subscriptionItemId) {
      return new Response(
        JSON.stringify({ error: "No subscription item found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if upgrade or downgrade based on sort_order or price
    const currentOrder = currentPlan?.sort_order ?? 0;
    const targetOrder = targetPlan.sort_order ?? 0;
    const isUpgrade = targetOrder > currentOrder;

    // Update the Stripe subscription
    const updatedSub = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [{ id: subscriptionItemId, price: newPriceId }],
        // Upgrades: prorate and charge immediately
        // Downgrades: apply at end of period
        proration_behavior: isUpgrade ? "create_prorations" : "none",
        ...(isUpgrade ? {} : {
          // For downgrades, schedule the change at period end
          cancel_at_period_end: false,
        }),
        metadata: {
          ...stripeSub.metadata,
          plan_id: planId,
          plan_slug: targetPlan.slug,
          billing_cycle: cycle,
        },
      }
    );

    // Update local DB
    await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        billing_cycle: cycle,
        current_period_start: new Date(updatedSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", profile.organization_id);

    await supabase
      .from("organizations")
      .update({ plan: targetPlan.slug })
      .eq("id", profile.organization_id);

    return new Response(
      JSON.stringify({
        success: true,
        isUpgrade,
        plan: targetPlan.name,
        message: isUpgrade
          ? `Upgraded to ${targetPlan.name}. Prorated charges applied.`
          : `Changed to ${targetPlan.name}. Takes effect at end of current period.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Update subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
