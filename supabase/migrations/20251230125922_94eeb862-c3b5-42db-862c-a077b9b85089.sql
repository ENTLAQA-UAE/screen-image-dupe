-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Org members can view notifications for their organization
CREATE POLICY "Org members can view their notifications"
ON public.notifications
FOR SELECT
USING (
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Org members can update (mark as read) their notifications
CREATE POLICY "Org members can update their notifications"
ON public.notifications
FOR UPDATE
USING (
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Super admins can manage all notifications
CREATE POLICY "Super admins can manage all notifications"
ON public.notifications
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Org admins and HR admins can insert notifications for their org
CREATE POLICY "Admins can create notifications for their org"
ON public.notifications
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_notifications_org_created ON public.notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(organization_id, is_read);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;