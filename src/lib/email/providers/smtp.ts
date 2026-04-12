import type {
  EmailMessage,
  EmailProviderAdapter,
  EmailResult,
} from '@/lib/email/types';

/**
 * Direct SMTP email provider adapter.
 *
 * Uses the built-in Node.js approach via a lightweight fetch-based
 * SMTP relay. For production, this calls a Next.js API route that
 * uses nodemailer under the hood.
 *
 * NOTE: Direct SMTP from serverless functions has limitations (connection
 * pooling, timeouts). For high-volume sending, use an API-based provider.
 * SMTP is offered for tenants who have their own mail server (Exchange,
 * Zimbra, etc.) and want to send through it.
 */
export class SmtpAdapter implements EmailProviderAdapter {
  readonly name = 'smtp' as const;
  private host: string;
  private port: number;
  private secure: boolean;
  private username: string;
  private password: string;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  }) {
    this.host = config.host;
    this.port = config.port;
    this.secure = config.secure;
    this.username = config.username;
    this.password = config.password;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    // Dynamic import of nodemailer (only loaded when SMTP is used)
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.username,
          pass: this.password,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      const to = Array.isArray(message.to) ? message.to : [message.to];

      const info = await transporter.sendMail({
        from: message.fromName
          ? `${message.fromName} <${message.from}>`
          : message.from,
        to: to.join(', '),
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SMTP send failed',
      };
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.username,
          pass: this.password,
        },
        connectionTimeout: 10000,
      });

      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
