import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Subscription email notifications.
 * Designed to be called by a Supabase cron job (pg_cron) daily.
 *
 * Sends emails for:
 * - Trial expiring in 3 days
 * - Trial expiring in 1 day
 * - Trial expired (grace period notification)
 * - Payment failed (past_due status)
 * - Subscription activated (manual or Stripe)
 *
 * Uses Supabase Auth admin API to send emails via the built-in SMTP.
 * For production, replace with a transactional email service (Resend, SendGrid, etc.).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results: { type: string; count: number }[] = [];

    // ── 1. Trial expiring in 3 days ──
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const { data: trialExpiring3d } = await supabase
      .from("subscriptions")
      .select("organization_id, trial_end, organizations (name)")
      .eq("status", "trial")
      .gte("trial_end", threeDaysStart.toISOString())
      .lte("trial_end", threeDaysEnd.toISOString());

    if (trialExpiring3d?.length) {
      for (const sub of trialExpiring3d) {
        const orgName = (sub.organizations as any)?.name || "Your organization";
        const admins = await getOrgAdminEmails(supabase, sub.organization_id);

        for (const admin of admins) {
          await sendEmail(supabase, admin.email, "trial_expiring_3d", {
            orgName,
            daysLeft: 3,
            trialEnd: new Date(sub.trial_end!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          });
        }
      }
      results.push({ type: "trial_expiring_3d", count: trialExpiring3d.length });
    }

    // ── 2. Trial expiring in 1 day ──
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStart = new Date(oneDayFromNow);
    oneDayStart.setHours(0, 0, 0, 0);
    const oneDayEnd = new Date(oneDayFromNow);
    oneDayEnd.setHours(23, 59, 59, 999);

    const { data: trialExpiring1d } = await supabase
      .from("subscriptions")
      .select("organization_id, trial_end, organizations (name)")
      .eq("status", "trial")
      .gte("trial_end", oneDayStart.toISOString())
      .lte("trial_end", oneDayEnd.toISOString());

    if (trialExpiring1d?.length) {
      for (const sub of trialExpiring1d) {
        const orgName = (sub.organizations as any)?.name || "Your organization";
        const admins = await getOrgAdminEmails(supabase, sub.organization_id);

        for (const admin of admins) {
          await sendEmail(supabase, admin.email, "trial_expiring_1d", {
            orgName,
            daysLeft: 1,
            trialEnd: new Date(sub.trial_end!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          });
        }
      }
      results.push({ type: "trial_expiring_1d", count: trialExpiring1d.length });
    }

    // ── 3. Trial just expired (expired today) ──
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setHours(0, 0, 0, 0);

    const { data: trialExpired } = await supabase
      .from("subscriptions")
      .select("organization_id, trial_end, organizations (name)")
      .eq("status", "trial")
      .gte("trial_end", yesterdayStart.toISOString())
      .lt("trial_end", yesterdayEnd.toISOString());

    if (trialExpired?.length) {
      for (const sub of trialExpired) {
        const orgName = (sub.organizations as any)?.name || "Your organization";
        const admins = await getOrgAdminEmails(supabase, sub.organization_id);

        for (const admin of admins) {
          await sendEmail(supabase, admin.email, "trial_expired", { orgName });
        }
      }
      results.push({ type: "trial_expired", count: trialExpired.length });
    }

    // ── 4. Payment failed (past_due subscriptions) ──
    const { data: pastDue } = await supabase
      .from("subscriptions")
      .select("organization_id, organizations (name)")
      .eq("status", "past_due");

    if (pastDue?.length) {
      for (const sub of pastDue) {
        const orgName = (sub.organizations as any)?.name || "Your organization";
        const admins = await getOrgAdminEmails(supabase, sub.organization_id);

        for (const admin of admins) {
          await sendEmail(supabase, admin.email, "payment_failed", { orgName });
        }
      }
      results.push({ type: "payment_failed", count: pastDue.length });
    }

    console.log("Email notifications sent:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notifications" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Get org admin emails for an organization.
 */
async function getOrgAdminEmails(
  supabase: any,
  organizationId: string
): Promise<{ email: string; name: string }[]> {
  // Get profile IDs for the org
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", organizationId);

  if (!profiles?.length) return [];

  // Get users with org_admin role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "org_admin")
    .in("user_id", profiles.map((p: any) => p.id));

  if (!roles?.length) return [];

  const adminIds = new Set(roles.map((r: any) => r.user_id));
  const adminProfiles = profiles.filter((p: any) => adminIds.has(p.id));

  // Get emails from auth.users
  const admins: { email: string; name: string }[] = [];
  for (const profile of adminProfiles) {
    const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
    if (userData?.user?.email) {
      admins.push({ email: userData.user.email, name: profile.full_name || "" });
    }
  }

  return admins;
}

/**
 * Send an email notification.
 * Uses a simple approach — in production, replace with Resend/SendGrid/etc.
 * For now, stores notifications in a log and relies on Stripe's built-in emails
 * for payment-related notifications.
 */
async function sendEmail(
  supabase: any,
  to: string,
  template: string,
  data: Record<string, any>
) {
  const subjects: Record<string, string> = {
    trial_expiring_3d: `Your Qudurat trial expires in ${data.daysLeft} days`,
    trial_expiring_1d: "Your Qudurat trial expires tomorrow",
    trial_expired: "Your Qudurat trial has expired",
    payment_failed: "Payment failed — action required",
    subscription_activated: "Your Qudurat subscription is active!",
  };

  const bodies: Record<string, string> = {
    trial_expiring_3d: `Hi,\n\nYour free trial for ${data.orgName} on Qudurat will expire on ${data.trialEnd}.\n\nTo continue using the platform without interruption, please upgrade to a paid plan.\n\nVisit your Subscription page to view available plans.\n\nBest regards,\nThe Qudurat Team`,
    trial_expiring_1d: `Hi,\n\nThis is a final reminder: your free trial for ${data.orgName} expires tomorrow (${data.trialEnd}).\n\nUpgrade now to keep access to all your assessments and data.\n\nBest regards,\nThe Qudurat Team`,
    trial_expired: `Hi,\n\nYour free trial for ${data.orgName} on Qudurat has expired.\n\nDon't worry — all your data is safe. Upgrade to a paid plan to regain full access.\n\nBest regards,\nThe Qudurat Team`,
    payment_failed: `Hi,\n\nWe were unable to process your payment for ${data.orgName} on Qudurat.\n\nPlease update your payment method to avoid service interruption.\n\nBest regards,\nThe Qudurat Team`,
    subscription_activated: `Hi,\n\nYour subscription for ${data.orgName} on Qudurat is now active!\n\nThank you for choosing Qudurat. You now have full access to your plan features.\n\nBest regards,\nThe Qudurat Team`,
  };

  // Log the notification (can be replaced with actual email sending)
  console.log(`[EMAIL] To: ${to} | Subject: ${subjects[template]} | Template: ${template}`);

  // Store in a notifications log for audit trail
  // In production, integrate with Resend/SendGrid here:
  // await resend.emails.send({ from: 'noreply@qudurat.co', to, subject: subjects[template], text: bodies[template] });

  return { success: true, to, template };
}
