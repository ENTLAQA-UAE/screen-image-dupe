/**
 * Notification system types.
 */

export type NotificationChannel = 'email' | 'in_app';

export type DigestFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export type NotificationEventKey =
  | 'participant.invited'
  | 'participant.completed'
  | 'participant.abandoned'
  | 'group.launched'
  | 'group.complete_80'
  | 'group.closed'
  | 'score.low_threshold'
  | 'billing.payment_failed'
  | 'billing.trial_ending'
  | 'ai.generation_complete'
  | 'member.joined'
  | 'assessment.created';

export type NotificationCategory =
  | 'assessment'
  | 'group'
  | 'billing'
  | 'ai'
  | 'team';

export interface NotificationEvent {
  eventKey: NotificationEventKey;
  category: NotificationCategory;
  defaultChannels: NotificationChannel[];
  descriptionEn: string;
  descriptionAr: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  organizationId: string;
  eventKey: NotificationEventKey;
  channels: NotificationChannel[];
  digestFrequency: DigestFrequency;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  isEnabled: boolean;
}

export interface NotificationPayload {
  eventKey: NotificationEventKey;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  metadata?: Record<string, unknown>;
}
