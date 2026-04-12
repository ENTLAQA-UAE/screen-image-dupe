'use client';

import { Loader2, Mail, Monitor, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  saveNotificationPreferencesAction,
  saveQuietHoursAction,
} from '@/app/[locale]/(app)/settings/notifications/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EventDef {
  event_key: string;
  category: string;
  default_channels: string[];
  description_en: string;
  description_ar: string;
}

interface Props {
  events: EventDef[];
  preferences: Record<string, { channels: string[]; isEnabled: boolean }>;
  quietHours: {
    start: string | null;
    end: string | null;
    timezone: string;
  };
  locale: string;
}

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  assessment: { en: 'Assessments', ar: 'التقييمات' },
  group: { en: 'Groups', ar: 'المجموعات' },
  billing: { en: 'Billing', ar: 'الفواتير' },
  ai: { en: 'AI', ar: 'الذكاء الاصطناعي' },
  team: { en: 'Team', ar: 'الفريق' },
};

export function NotificationPreferencesForm({
  events,
  preferences: initialPrefs,
  quietHours: initialQuietHours,
  locale,
}: Props) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [quietHours, setQuietHours] = useState(initialQuietHours);
  const [isSaving, startSaving] = useTransition();
  const [isSavingQuiet, startSavingQuiet] = useTransition();
  const isArabic = locale === 'ar';

  const toggleChannel = (eventKey: string, channel: string) => {
    setPrefs((prev) => {
      const current = prev[eventKey]!;
      const hasChannel = current.channels.includes(channel);
      return {
        ...prev,
        [eventKey]: {
          ...current,
          channels: hasChannel
            ? current.channels.filter((c) => c !== channel)
            : [...current.channels, channel],
        },
      };
    });
  };

  const toggleEnabled = (eventKey: string) => {
    setPrefs((prev) => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey]!,
        isEnabled: !prev[eventKey]!.isEnabled,
      },
    }));
  };

  const handleSave = () => {
    startSaving(async () => {
      const result = await saveNotificationPreferencesAction(
        Object.entries(prefs).map(([eventKey, p]) => ({
          eventKey,
          channels: p.channels,
          isEnabled: p.isEnabled,
        })),
      );
      if (result.ok) toast.success('Preferences saved');
      else toast.error(result.message ?? 'Failed to save');
    });
  };

  const handleSaveQuietHours = () => {
    startSavingQuiet(async () => {
      const result = await saveQuietHoursAction(
        quietHours.start,
        quietHours.end,
        quietHours.timezone,
      );
      if (result.ok) toast.success('Quiet hours saved');
      else toast.error(result.message ?? 'Failed to save');
    });
  };

  // Group events by category
  const categories = [...new Set(events.map((e) => e.category))];

  return (
    <div className="space-y-8">
      {/* Event toggles by category */}
      {categories.map((category) => {
        const categoryEvents = events.filter((e) => e.category === category);
        const label = CATEGORY_LABELS[category];

        return (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {isArabic ? label?.ar : label?.en ?? category}
            </h3>
            <div className="space-y-2">
              {categoryEvents.map((event) => {
                const pref = prefs[event.event_key];
                if (!pref) return null;

                return (
                  <div
                    key={event.event_key}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-border p-3 transition-opacity',
                      !pref.isEnabled && 'opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={pref.isEnabled}
                        onChange={() => toggleEnabled(event.event_key)}
                        className="h-4 w-4 rounded border-input text-primary"
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {isArabic
                            ? event.description_ar
                            : event.description_en}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {event.event_key}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleChannel(event.event_key, 'email')
                        }
                        disabled={!pref.isEnabled}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          pref.channels.includes('email')
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toggleChannel(event.event_key, 'in_app')
                        }
                        disabled={!pref.isEnabled}
                        className={cn(
                          'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          pref.channels.includes('in_app')
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        <Monitor className="h-3 w-3" />
                        In-app
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save preferences
      </Button>

      {/* Quiet hours */}
      <div className="border-t border-border pt-6">
        <h3 className="mb-3 text-sm font-semibold">
          Quiet hours
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Notifications will be held during quiet hours and delivered when they end.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="quietStart">Start time</Label>
            <Input
              id="quietStart"
              type="time"
              value={quietHours.start ?? ''}
              onChange={(e) =>
                setQuietHours((q) => ({ ...q, start: e.target.value || null }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quietEnd">End time</Label>
            <Input
              id="quietEnd"
              type="time"
              value={quietHours.end ?? ''}
              onChange={(e) =>
                setQuietHours((q) => ({ ...q, end: e.target.value || null }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={quietHours.timezone}
              onChange={(e) =>
                setQuietHours((q) => ({ ...q, timezone: e.target.value }))
              }
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="Asia/Dubai">Dubai (GST, UTC+4)</option>
              <option value="Asia/Riyadh">Riyadh (AST, UTC+3)</option>
              <option value="Asia/Kuwait">Kuwait (AST, UTC+3)</option>
              <option value="Africa/Cairo">Cairo (EET, UTC+2)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="America/New_York">New York (EST/EDT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        <Button
          onClick={handleSaveQuietHours}
          disabled={isSavingQuiet}
          variant="outline"
          className="mt-4"
        >
          {isSavingQuiet && <Loader2 className="h-4 w-4 animate-spin" />}
          Save quiet hours
        </Button>
      </div>
    </div>
  );
}
