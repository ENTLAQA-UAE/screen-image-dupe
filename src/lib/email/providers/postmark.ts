import type {
  EmailMessage,
  EmailProviderAdapter,
  EmailResult,
} from '@/lib/email/types';

/**
 * Postmark email provider adapter.
 * @see https://postmarkapp.com/developer/api/email-api
 */
export class PostmarkAdapter implements EmailProviderAdapter {
  readonly name = 'postmark' as const;
  private serverToken: string;

  constructor(serverToken: string) {
    this.serverToken = serverToken;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const to = Array.isArray(message.to) ? message.to.join(',') : message.to;

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': this.serverToken,
      },
      body: JSON.stringify({
        From: message.fromName
          ? `${message.fromName} <${message.from}>`
          : message.from,
        To: to,
        ReplyTo: message.replyTo,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        MessageStream: 'outbound',
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        Message?: string;
      };
      return {
        success: false,
        error: body.Message ?? `Postmark API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as { MessageID?: string };
    return { success: true, messageId: data.MessageID };
  }

  async verifyCredentials(): Promise<boolean> {
    const response = await fetch('https://api.postmarkapp.com/server', {
      headers: {
        Accept: 'application/json',
        'X-Postmark-Server-Token': this.serverToken,
      },
    });
    return response.ok;
  }
}
