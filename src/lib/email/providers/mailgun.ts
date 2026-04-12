import type {
  EmailMessage,
  EmailProviderAdapter,
  EmailResult,
} from '@/lib/email/types';

/**
 * Mailgun email provider adapter.
 * Uses the Mailgun REST API (no SDK dependency).
 * @see https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Messages/
 */
export class MailgunAdapter implements EmailProviderAdapter {
  readonly name = 'mailgun' as const;
  private apiKey: string;
  private domain: string;
  private region: string;

  constructor(apiKey: string, domain: string, region: string = 'us') {
    this.apiKey = apiKey;
    this.domain = domain;
    this.region = region;
  }

  private get baseUrl() {
    return this.region === 'eu'
      ? 'https://api.eu.mailgun.net/v3'
      : 'https://api.mailgun.net/v3';
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const to = Array.isArray(message.to) ? message.to.join(',') : message.to;

    const form = new URLSearchParams();
    form.append(
      'from',
      message.fromName
        ? `${message.fromName} <${message.from}>`
        : message.from,
    );
    form.append('to', to);
    form.append('subject', message.subject);
    form.append('html', message.html);
    if (message.text) form.append('text', message.text);
    if (message.replyTo) form.append('h:Reply-To', message.replyTo);

    if (message.tags) {
      for (const [key, value] of Object.entries(message.tags)) {
        form.append(`v:${key}`, value);
      }
    }

    const response = await fetch(
      `${this.baseUrl}/${this.domain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`api:${this.apiKey}`).toString('base64'),
        },
        body: form,
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      return {
        success: false,
        error: body.message ?? `Mailgun API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, messageId: data.id };
  }

  async verifyCredentials(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/domains/${this.domain}`, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`api:${this.apiKey}`).toString('base64'),
      },
    });
    return response.ok;
  }
}
