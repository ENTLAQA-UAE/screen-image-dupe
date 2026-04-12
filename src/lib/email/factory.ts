import type {
  EmailProviderAdapter,
  EmailProviderConfig,
} from '@/lib/email/types';

/**
 * Create an email provider adapter from configuration.
 *
 * This is the only place that knows about concrete adapter classes.
 * The rest of the app uses the EmailProviderAdapter interface.
 */
export async function createEmailProvider(
  config: EmailProviderConfig,
): Promise<EmailProviderAdapter> {
  switch (config.providerType) {
    case 'resend': {
      const { ResendAdapter } = await import('@/lib/email/providers/resend');
      if (!config.apiKey) throw new Error('Resend API key is required');
      return new ResendAdapter(config.apiKey);
    }

    case 'mailgun': {
      const { MailgunAdapter } = await import(
        '@/lib/email/providers/mailgun'
      );
      if (!config.apiKey) throw new Error('Mailgun API key is required');
      if (!config.domain) throw new Error('Mailgun domain is required');
      return new MailgunAdapter(
        config.apiKey,
        config.domain,
        config.region ?? 'us',
      );
    }

    case 'sendgrid': {
      const { SendGridAdapter } = await import(
        '@/lib/email/providers/sendgrid'
      );
      if (!config.apiKey) throw new Error('SendGrid API key is required');
      return new SendGridAdapter(config.apiKey);
    }

    case 'postmark': {
      const { PostmarkAdapter } = await import(
        '@/lib/email/providers/postmark'
      );
      if (!config.apiKey) throw new Error('Postmark server token is required');
      return new PostmarkAdapter(config.apiKey);
    }

    case 'smtp': {
      const { SmtpAdapter } = await import('@/lib/email/providers/smtp');
      if (!config.smtpHost) throw new Error('SMTP host is required');
      if (!config.smtpUsername)
        throw new Error('SMTP username is required');
      if (!config.smtpPassword)
        throw new Error('SMTP password is required');
      return new SmtpAdapter({
        host: config.smtpHost,
        port: config.smtpPort ?? 587,
        secure: config.smtpSecure ?? true,
        username: config.smtpUsername,
        password: config.smtpPassword,
      });
    }

    case 'ses': {
      // SES uses the same API pattern as Resend/SendGrid but through AWS SDK.
      // For now, fall back to SMTP mode (SES supports SMTP interface).
      const { SmtpAdapter } = await import('@/lib/email/providers/smtp');
      if (!config.smtpUsername)
        throw new Error('SES SMTP credentials required');
      return new SmtpAdapter({
        host: `email-smtp.${config.region ?? 'us-east-1'}.amazonaws.com`,
        port: 587,
        secure: true,
        username: config.smtpUsername,
        password: config.smtpPassword ?? '',
      });
    }

    default:
      throw new Error(`Unknown email provider: ${config.providerType}`);
  }
}
