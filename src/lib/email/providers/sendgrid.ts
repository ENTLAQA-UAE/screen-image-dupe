import type {
  EmailMessage,
  EmailProviderAdapter,
  EmailResult,
} from '@/lib/email/types';

/**
 * SendGrid email provider adapter.
 * @see https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
export class SendGridAdapter implements EmailProviderAdapter {
  readonly name = 'sendgrid' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const to = Array.isArray(message.to) ? message.to : [message.to];

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          { to: to.map((email) => ({ email })) },
        ],
        from: {
          email: message.from,
          name: message.fromName,
        },
        reply_to: message.replyTo
          ? { email: message.replyTo }
          : undefined,
        subject: message.subject,
        content: [
          ...(message.text
            ? [{ type: 'text/plain', value: message.text }]
            : []),
          { type: 'text/html', value: message.html },
        ],
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        errors?: Array<{ message: string }>;
      };
      return {
        success: false,
        error:
          body.errors?.[0]?.message ??
          `SendGrid API error: ${response.status}`,
      };
    }

    const messageId = response.headers.get('x-message-id') ?? undefined;
    return { success: true, messageId };
  }

  async verifyCredentials(): Promise<boolean> {
    const response = await fetch(
      'https://api.sendgrid.com/v3/scopes',
      { headers: { Authorization: `Bearer ${this.apiKey}` } },
    );
    return response.ok;
  }
}
