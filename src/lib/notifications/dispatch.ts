import 'server-only';

import { sendEmail } from '@/lib/email/service';
import { renderEmailTemplate } from '@/lib/email/templates';
import type { EmailTemplateKey, EmailTemplateVars } from '@/lib/email/types';
import type {
  NotificationChannel,
  NotificationPayload,
} from '@/lib/notifications/types';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Dispatch a notification to a specific user.
 *
 * Checks the user's preferences for the event, respects quiet hours,
 * and routes to enabled channels (in-app and/or email).
 *
 * Usage:
 *   await dispatchNotification(orgId, userId, {
 *     eventKey: 'participant.completed',
 *     title: 'Assessment completed',
 *     message: 'John Doe completed the Cognitive Test',
 *     metadata: { participantId: '...', assessmentId: '...' },
 *   });
 */
export async function dispatchNotification(
  organizationId: string,
  userId: string,
  payload: NotificationPayload,
  emailVars?: EmailTemplateVars & { templateKey?: EmailTemplateKey; language?: 'en' | 'ar' },
): Promise<{ channels: string[]; errors: string[] }> {
  const supabase = createAdminClient();
  const channels: string[] = [];
  const errors: string[] = [];

  // 1. Get user's preference for this event
  const { data: pref } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('event_key', payload.eventKey)
    .maybeSingle();

  // If no preference set, fall back to event defaults
  let enabledChannels: NotificationChannel[];
  let isEnabled = true;

  if (pref) {
    const p = pref as {
      channels: string[];
      is_enabled: boolean;
      digest_frequency: string;
      quiet_hours_start: string | null;
      quiet_hours_end: string | null;
      timezone: string;
    };
    isEnabled = p.is_enabled;
    enabledChannels = p.channels as NotificationChannel[];

    // Check quiet hours
    if (p.quiet_hours_start && p.quiet_hours_end) {
      const now = new Date();
      // Simple hour-based check (timezone-aware would need a library)
      const currentHour = now.getUTCHours();
      const startHour = parseInt(p.quiet_hours_start.split(':')[0] ?? '22');
      const endHour = parseInt(p.quiet_hours_end.split(':')[0] ?? '7');

      const inQuietHours =
        startHour > endHour
          ? currentHour >= startHour || currentHour < endHour // overnight
          : currentHour >= startHour && currentHour < endHour;

      if (inQuietHours) {
        await supabase.from('notification_log').insert({
          user_id: userId,
          organization_id: organizationId,
          event_key: payload.eventKey,
          channel: 'all',
          status: 'skipped_quiet_hours',
          metadata: payload.metadata ?? {},
        });
        return { channels: [], errors: [] };
      }
    }
  } else {
    // Get default channels from the event definition
    const { data: event } = await supabase
      .from('notification_events')
      .select('default_channels')
      .eq('event_key', payload.eventKey)
      .maybeSingle();

    enabledChannels = ((event as { default_channels: string[] } | null)
      ?.default_channels ?? ['in_app']) as NotificationChannel[];
  }

  if (!isEnabled) {
    return { channels: [], errors: [] };
  }

  // 2. Dispatch to each enabled channel
  for (const channel of enabledChannels) {
    try {
      if (channel === 'in_app') {
        await sendInApp(supabase, organizationId, userId, payload);
        channels.push('in_app');
      }

      if (channel === 'email') {
        const emailResult = await sendNotificationEmail(
          organizationId,
          userId,
          payload,
          emailVars,
        );
        if (emailResult.success) {
          channels.push('email');
        } else {
          errors.push(`email: ${emailResult.error}`);
        }
      }

      // Log the dispatch
      await supabase.from('notification_log').insert({
        user_id: userId,
        organization_id: organizationId,
        event_key: payload.eventKey,
        channel,
        status: 'sent',
        metadata: payload.metadata ?? {},
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${channel}: ${msg}`);

      await supabase.from('notification_log').insert({
        user_id: userId,
        organization_id: organizationId,
        event_key: payload.eventKey,
        channel,
        status: 'failed',
        error_message: msg,
        metadata: payload.metadata ?? {},
      });
    }
  }

  return { channels, errors };
}

/**
 * Dispatch a notification to ALL users in an organization
 * (e.g., group.complete_80, billing.payment_failed).
 */
export async function dispatchToOrg(
  organizationId: string,
  payload: NotificationPayload,
  emailVars?: EmailTemplateVars & { templateKey?: EmailTemplateKey; language?: 'en' | 'ar' },
  roleFilter?: string[], // Only notify users with these roles
): Promise<{ sent: number; errors: number }> {
  const supabase = createAdminClient();

  // Get all users in this org
  const query = supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId);

  const { data: profiles } = await query;

  if (!profiles || profiles.length === 0) {
    return { sent: 0, errors: 0 };
  }

  // If role filter, get users with matching roles
  let targetUserIds = (profiles as Array<{ id: string }>).map((p) => p.id);

  if (roleFilter && roleFilter.length > 0) {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('user_id', targetUserIds)
      .in('role', roleFilter);

    if (roles) {
      const roleUserIds = new Set(
        (roles as Array<{ user_id: string }>).map((r) => r.user_id),
      );
      targetUserIds = targetUserIds.filter((id) => roleUserIds.has(id));
    }
  }

  let sent = 0;
  let errorCount = 0;

  for (const userId of targetUserIds) {
    const result = await dispatchNotification(
      organizationId,
      userId,
      payload,
      emailVars,
    );
    if (result.channels.length > 0) sent++;
    if (result.errors.length > 0) errorCount++;
  }

  return { sent, errors: errorCount };
}

// ==============================================================================
// Internal helpers
// ==============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendInApp(
  supabase: any,
  organizationId: string,
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  await supabase.from('notifications').insert({
    organization_id: organizationId,
    user_id: userId,
    type: payload.eventKey,
    title: payload.title,
    message: payload.message,
    is_read: false,
    metadata: payload.metadata ?? {},
  });
}

async function sendNotificationEmail(
  organizationId: string,
  userId: string,
  payload: NotificationPayload,
  emailVars?: EmailTemplateVars & { templateKey?: EmailTemplateKey; language?: 'en' | 'ar' },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get user email from auth.users (not in profiles table)
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (!authUser?.user) {
    return { success: false, error: 'User not found' };
  }

  const p = {
    email: authUser.user.email ?? '',
    full_name: (profile as { full_name: string | null } | null)?.full_name,
  };

  // If we have a template key and vars, render a proper template
  if (emailVars?.templateKey) {
    const lang = emailVars.language ?? 'en';
    const { subject, html, text } = renderEmailTemplate(
      emailVars.templateKey,
      {
        recipientName: p.full_name ?? p.email,
        recipientEmail: p.email,
        ...emailVars,
      },
      lang,
    );

    return await sendEmail(
      organizationId,
      { to: p.email, subject, html, text },
      emailVars.templateKey,
    );
  }

  // Fallback: send a simple notification email
  return await sendEmail(organizationId, {
    to: p.email,
    subject: payload.title,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">${payload.title}</h2>
        <p style="color: #334155;">${payload.message}</p>
      </div>
    `,
    text: `${payload.title}\n\n${payload.message}`,
  });
}
