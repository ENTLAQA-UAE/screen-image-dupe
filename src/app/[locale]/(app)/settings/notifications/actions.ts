'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function saveNotificationPreferencesAction(
  preferences: Array<{
    eventKey: string;
    channels: string[];
    isEnabled: boolean;
  }>,
): Promise<{ ok: boolean; message?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const supabase = await createClient();

  for (const pref of preferences) {
    await supabase.from('user_notification_preferences').upsert(
      {
        user_id: profile.id,
        organization_id: profile.organizationId,
        event_key: pref.eventKey,
        channels: pref.channels,
        is_enabled: pref.isEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,organization_id,event_key' },
    );
  }

  revalidatePath('/[locale]/(app)/settings/notifications');
  return { ok: true };
}

export async function saveQuietHoursAction(
  quietHoursStart: string | null,
  quietHoursEnd: string | null,
  timezone: string,
): Promise<{ ok: boolean; message?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Update quiet hours on ALL preferences for this user
  await supabase
    .from('user_notification_preferences')
    .update({
      quiet_hours_start: quietHoursStart,
      quiet_hours_end: quietHoursEnd,
      timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)
    .eq('organization_id', profile.organizationId);

  revalidatePath('/[locale]/(app)/settings/notifications');
  return { ok: true };
}
