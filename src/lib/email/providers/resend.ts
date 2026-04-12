import type {
  EmailMessage,
  EmailProviderAdapter,
  EmailResult,
} from '@/lib/email/types';

/**
 * Resend email provider adapter.
 * @see https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendAdapter implements EmailProviderAdapter {
  readonly name = 'resend' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const to = Array.isArray(message.to) ? message.to : [message.to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.fromName
          ? `${message.fromName} <${message.from}>`
          : message.from,
        to,
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        tags: message.tags
          ? Object.entries(message.tags).map(([name, value]) => ({
              name,
              value,
            }))
          : undefined,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      return {
        success: false,
        error: body.message ?? `Resend API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, messageId: data.id };
  }

  async verifyCredentials(): Promise<boolean> {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.ok;
  }
}
