import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe config from payment_providers
    const { data: provider } = await supabase
      .from("payment_providers")
      .select("api_key_encrypted, webhook_secret_encrypted")
      .eq("provider_type", "stripe")
      .eq("is_active", true)
      .single();

    if (!provider?.api_key_encrypted || !provider?.webhook_secret_encrypted) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(provider.api_key_encrypted, {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, provider.webhook_secret_encrypted);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;

        if (!orgId) break;

        // Get subscription details from Stripe
        if (session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
          const billingCycle = stripeSub.metadata?.billing_cycle || "monthly";
          const planSlug = stripeSub.metadata?.plan_slug;

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              stripe_subscription_id: stripeSub.id,
              stripe_customer_id: session.customer as string,
              plan_id: planId || undefined,
              billing_cycle: billingCycle,
              payment_method: "stripe",
              trial_end: null,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("organization_id", orgId);

          // Update org plan
          if (planSlug) {
            await supabase
              .from("organizations")
              .update({ plan: planSlug, is_active: true })
              .eq("id", orgId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organization_id;
        if (!orgId) break;

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          trialing: "trial",
        };

        await supabase
          .from("subscriptions")
          .update({
            status: statusMap[sub.status] || sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", orgId);

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organization_id;
        if (!orgId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", orgId);

        await supabase
          .from("organizations")
          .update({ is_active: false })
          .eq("id", orgId);

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const orgId = (invoice.subscription_details?.metadata as any)?.organization_id;

        if (orgId && invoice.id) {
          // Record invoice in invoices table if it exists
          await supabase.from("invoices").upsert({
            stripe_invoice_id: invoice.id,
            organization_id: orgId,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || "usd",
            status: "paid",
            paid_at: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
              : new Date().toISOString(),
            invoice_url: invoice.hosted_invoice_url || null,
            invoice_pdf: invoice.invoice_pdf || null,
          }, { onConflict: "stripe_invoice_id" }).then(() => {});
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const orgId = (invoice.subscription_details?.metadata as any)?.organization_id;
        if (!orgId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", orgId);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
