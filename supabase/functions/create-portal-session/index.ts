import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    // Get Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found. Please subscribe first." }),
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

    const { returnUrl } = await req.json().catch(() => ({}));

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${req.headers.get("origin")}/subscription`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Portal session error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
