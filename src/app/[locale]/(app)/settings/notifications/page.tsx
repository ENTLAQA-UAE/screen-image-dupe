import { Bell } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { NotificationPreferencesForm } from '@/app/[locale]/(app)/settings/notifications/preferences-form';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Notification preferences',
};

async function getEventDefinitions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notification_events')
    .select('event_key, category, default_channels, description_en, description_ar')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (data ?? []) as Array<{
    event_key: string;
    category: string;
    default_channels: string[];
    description_en: string;
    description_ar: string;
  }>;
}

async function getUserPreferences(userId: string, organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_notification_preferences')
    .select('event_key, channels, is_enabled, quiet_hours_start, quiet_hours_end, timezone')
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  return (data ?? []) as Array<{
    event_key: string;
    channels: string[];
    is_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    timezone: string;
  }>;
}

async function getRecentNotificationLog(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notification_log')
    .select('event_key, channel, status, sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(20);

  return (data ?? []) as Array<{
    event_key: string;
    channel: string;
    status: string;
    sent_at: string;
  }>;
}

export default async function NotificationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const [events, preferences, recentLog] = await Promise.all([
    getEventDefinitions(),
    getUserPreferences(profile.id, profile.organizationId),
    getRecentNotificationLog(profile.id),
  ]);

  // Build preferences map
  const prefsMap = new Map(
    preferences.map((p) => [p.event_key, p]),
  );

  // Get quiet hours from first preference (same across all)
  const firstPref = preferences[0];

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <PageHeader
        title="Notification preferences"
        description="Choose which notifications you receive and how they're delivered"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Event preferences
          </CardTitle>
          <CardDescription>
            Toggle channels per event type. Changes save automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            events={events}
            preferences={Object.fromEntries(
              events.map((e) => [
                e.event_key,
                {
                  channels: prefsMap.get(e.event_key)?.channels ?? e.default_channels,
                  isEnabled: prefsMap.get(e.event_key)?.is_enabled ?? true,
                },
              ]),
            )}
            quietHours={{
              start: firstPref?.quiet_hours_start ?? null,
              end: firstPref?.quiet_hours_end ?? null,
              timezone: firstPref?.timezone ?? 'Asia/Dubai',
            }}
            locale={locale}
          />
        </CardContent>
      </Card>

      {/* Recent notification log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent notifications</CardTitle>
          <CardDescription>
            Last 20 notifications sent to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLog.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentLog.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium">
                      {log.channel}
                    </span>
                    <span className="text-sm">
                      {log.event_key.replace('.', ' → ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium ${
                        log.status === 'sent'
                          ? 'text-green-600'
                          : log.status === 'failed'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(log.sent_at))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
