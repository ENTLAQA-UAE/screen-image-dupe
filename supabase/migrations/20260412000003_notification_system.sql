-- ==============================================================================
-- Phase 2 Week 11: Notification System
-- ==============================================================================
-- Per-user notification preferences with channel routing (email + in-app),
-- digest frequency, quiet hours, and a notification log.
--
-- Reuses the existing `notifications` table for in-app notifications.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Notification event definitions (seed table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,                   -- 'assessment', 'group', 'billing', 'ai', 'team'
  default_channels TEXT[] DEFAULT ARRAY['in_app'],
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Seed the 12 event types
INSERT INTO public.notification_events (event_key, category, default_channels, description_en, description_ar, sort_order)
VALUES
  ('participant.invited', 'assessment', ARRAY['email'], 'Participant was invited to an assessment', 'تمت دعوة مشارك لأداء تقييم', 1),
  ('participant.completed', 'assessment', ARRAY['email','in_app'], 'Participant completed an assessment', 'أكمل مشارك تقييماً', 2),
  ('participant.abandoned', 'assessment', ARRAY['in_app'], 'Participant abandoned an assessment', 'تخلى مشارك عن تقييم', 3),
  ('group.launched', 'group', ARRAY['in_app'], 'Assessment group was activated', 'تم تفعيل مجموعة تقييم', 4),
  ('group.complete_80', 'group', ARRAY['email','in_app'], 'Group reached 80% completion', 'وصلت المجموعة إلى 80% إكمال', 5),
  ('group.closed', 'group', ARRAY['email','in_app'], 'Group was closed', 'تم إغلاق المجموعة', 6),
  ('score.low_threshold', 'assessment', ARRAY['email'], 'Participant scored below threshold', 'حصل مشارك على درجة أقل من الحد', 7),
  ('billing.payment_failed', 'billing', ARRAY['email'], 'Subscription payment failed', 'فشل دفع الاشتراك', 8),
  ('billing.trial_ending', 'billing', ARRAY['email'], 'Trial ending soon', 'التجربة المجانية تنتهي قريباً', 9),
  ('ai.generation_complete', 'ai', ARRAY['in_app'], 'AI report generation completed', 'اكتمل إنشاء التقرير بالذكاء الاصطناعي', 10),
  ('member.joined', 'team', ARRAY['in_app'], 'New team member joined', 'انضم عضو جديد للفريق', 11),
  ('assessment.created', 'assessment', ARRAY['in_app'], 'New assessment created', 'تم إنشاء تقييم جديد', 12)
ON CONFLICT (event_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. User notification preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL REFERENCES public.notification_events(event_key),

  channels TEXT[] DEFAULT ARRAY['email','in_app'],
  digest_frequency TEXT DEFAULT 'realtime'
    CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),

  -- Quiet hours (timezone-aware)
  quiet_hours_start TIME,                   -- e.g., '22:00'
  quiet_hours_end TIME,                     -- e.g., '07:00'
  timezone TEXT DEFAULT 'Asia/Dubai',

  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, organization_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_unp_user ON public.user_notification_preferences(user_id, organization_id);

-- -----------------------------------------------------------------------------
-- 3. Notification log (every notification dispatched)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL,                    -- 'email', 'in_app'
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'pending_digest', 'digested', 'skipped_quiet_hours')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nl_user ON public.notification_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nl_org ON public.notification_log(organization_id, sent_at DESC);

-- -----------------------------------------------------------------------------
-- 4. RLS Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Events: readable by all authenticated
DROP POLICY IF EXISTS "Events readable by authenticated" ON public.notification_events;
CREATE POLICY "Events readable by authenticated"
  ON public.notification_events FOR SELECT
  TO authenticated
  USING (true);

-- Preferences: users manage their own
DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users manage own preferences"
  ON public.user_notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admins can view all preferences
DROP POLICY IF EXISTS "Super admins view all preferences" ON public.user_notification_preferences;
CREATE POLICY "Super admins view all preferences"
  ON public.user_notification_preferences FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Notification log: users see their own
DROP POLICY IF EXISTS "Users view own notification log" ON public.notification_log;
CREATE POLICY "Users view own notification log"
  ON public.notification_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

-- Service role / authenticated can insert logs
DROP POLICY IF EXISTS "Insert notification log" ON public.notification_log;
CREATE POLICY "Insert notification log"
  ON public.notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. Ensure existing notifications table has proper indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

COMMIT;
