import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;
  private readonly appUrl: string;
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService) {
    this.isDev = config.get<string>('NODE_ENV') !== 'production';
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
    this.fromAddress = config.get<string>('SMTP_USER', 'noreply@opsnext.io');

    if (this.isDev) {
      // In dev/test, use a no-op (ethereal-like) transport — all emails log to console
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      this.transporter = nodemailer.createTransport({
        host: config.getOrThrow<string>('SMTP_HOST'),
        port: config.getOrThrow<number>('SMTP_PORT'),
        secure: config.get<number>('SMTP_PORT') === 465,
        auth: {
          user: config.getOrThrow<string>('SMTP_USER'),
          pass: config.getOrThrow<string>('SMTP_PASS'),
        },
      });
    }
  }

  /**
   * Send an invitation email to a new user.
   */
  async sendInvite(
    to: string,
    inviteUrl: string,
    orgName: string,
    inviterName: string,
  ): Promise<void> {
    const subject = `You've been invited to join ${orgName} on OpsNext CRM`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a56db;">You're Invited!</h2>
          <p>Hi there,</p>
          <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join
            <strong>${escapeHtml(orgName)}</strong> on OpsNext CRM.</p>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <p style="margin: 32px 0;">
            <a href="${escapeHtml(inviteUrl)}"
               style="background-color:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            This invitation link expires in 72 hours. If you weren't expecting this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;"/>
          <p style="color: #999; font-size: 12px;">OpsNext CRM &mdash; <a href="${escapeHtml(this.appUrl)}">${escapeHtml(this.appUrl)}</a></p>
        </body>
      </html>
    `;

    await this.send(to, subject, html);
  }

  /**
   * Send a password-reset email.
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your OpsNext CRM password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a56db;">Password Reset Request</h2>
          <p>Hi,</p>
          <p>We received a request to reset the password for your OpsNext CRM account.</p>
          <p>Click the button below to choose a new password:</p>
          <p style="margin: 32px 0;">
            <a href="${escapeHtml(resetUrl)}"
               style="background-color:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;"/>
          <p style="color: #999; font-size: 12px;">OpsNext CRM &mdash; <a href="${escapeHtml(this.appUrl)}">${escapeHtml(this.appUrl)}</a></p>
        </body>
      </html>
    `;

    await this.send(to, subject, html);
  }

  /**
   * Send a welcome email after a user successfully accepts their invitation.
   */
  async sendWelcome(to: string, firstName: string, orgName: string): Promise<void> {
    const subject = `Welcome to ${orgName} on OpsNext CRM!`;
    const loginUrl = `${this.appUrl}/login`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a56db;">Welcome, ${escapeHtml(firstName)}!</h2>
          <p>Your account for <strong>${escapeHtml(orgName)}</strong> on OpsNext CRM is now active.</p>
          <p>You can log in and start using OpsNext CRM right away:</p>
          <p style="margin: 32px 0;">
            <a href="${escapeHtml(loginUrl)}"
               style="background-color:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Go to OpsNext CRM
            </a>
          </p>
          <p>If you have any questions, reach out to your organization admin.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;"/>
          <p style="color: #999; font-size: 12px;">OpsNext CRM &mdash; <a href="${escapeHtml(this.appUrl)}">${escapeHtml(this.appUrl)}</a></p>
        </body>
      </html>
    `;

    await this.send(to, subject, html);
  }

  /**
   * Send a task due-date reminder to the assignee.
   */
  async sendTaskReminder(
    to: string,
    assigneeName: string,
    taskTitle: string,
    dueAt: Date,
    orgName: string,
  ): Promise<void> {
    const subject = `Reminder: "${taskTitle}" is due soon`;
    const tasksUrl = `${this.appUrl}/activities`;
    const dueStr = dueAt.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a56db;">Task Due Soon</h2>
          <p>Hi ${escapeHtml(assigneeName)},</p>
          <p>This is a reminder that the following task is due within the next hour:</p>
          <div style="background:#f8fafc;border-left:4px solid #1a56db;padding:16px 20px;border-radius:4px;margin:24px 0;">
            <strong style="font-size:16px;">${escapeHtml(taskTitle)}</strong><br/>
            <span style="color:#64748b;font-size:13px;">Due: ${escapeHtml(dueStr)}</span>
          </div>
          <p style="margin: 32px 0;">
            <a href="${escapeHtml(tasksUrl)}"
               style="background-color:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              View Tasks
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;"/>
          <p style="color: #999; font-size: 12px;">${escapeHtml(orgName)} &mdash; OpsNext CRM</p>
        </body>
      </html>
    `;

    await this.send(to, subject, html);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.isDev) {
      this.logger.log(
        `[DEV] Email not sent (NODE_ENV !== production). Would have sent:\n` +
          `  To: ${to}\n` +
          `  Subject: ${subject}\n`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"OpsNext CRM" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: "${subject}"`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}

/** Minimal HTML escaping to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
