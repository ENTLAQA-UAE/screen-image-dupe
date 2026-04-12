/**
 * Email provider adapter interface.
 *
 * All email providers (Resend, Mailgun, SendGrid, SES, Postmark, SMTP)
 * implement this interface so the rest of the app doesn't care which
 * provider the tenant configured.
 */

export type EmailProviderType =
  | 'resend'
  | 'mailgun'
  | 'sendgrid'
  | 'ses'
  | 'postmark'
  | 'smtp';

export interface EmailMessage {
  to: string | string[];
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProviderAdapter {
  readonly name: EmailProviderType;

  /**
   * Send a single email.
   */
  send(message: EmailMessage): Promise<EmailResult>;

  /**
   * Verify the credentials are valid (e.g., test API key).
   * Returns true if valid, throws or returns false if not.
   */
  verifyCredentials(): Promise<boolean>;
}

/**
 * Configuration needed to instantiate any email provider.
 */
export interface EmailProviderConfig {
  providerType: EmailProviderType;
  apiKey?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;

  // SMTP-specific
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;

  // Mailgun-specific
  domain?: string;

  // SES-specific
  region?: string;
}

/**
 * Email template key — identifies which lifecycle email to send.
 */
export type EmailTemplateKey =
  | 'welcome'
  | 'invite'
  | 'reminder'
  | 'completion'
  | 'result_ready'
  | 'trial_ending'
  | 'trial_expired'
  | 'payment_failed'
  | 'password_reset';

/**
 * Variables available for template interpolation.
 */
export interface EmailTemplateVars {
  recipientName?: string;
  recipientEmail?: string;
  organizationName?: string;
  organizationLogo?: string;
  assessmentTitle?: string;
  assessmentUrl?: string;
  groupName?: string;
  score?: string | number;
  completionTime?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  dashboardUrl?: string;
  upgradeUrl?: string;
  resetUrl?: string;
  loginUrl?: string;
  amount?: string;
  updatePaymentUrl?: string;
  [key: string]: string | number | undefined;
}
