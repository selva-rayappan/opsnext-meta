"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.isDev = config.get('NODE_ENV') !== 'production';
        this.appUrl = config.get('APP_URL', 'http://localhost:3000');
        this.fromAddress = config.get('SMTP_USER', 'noreply@opsnext.io');
        if (this.isDev) {
            this.transporter = nodemailer.createTransport({ jsonTransport: true });
        }
        else {
            this.transporter = nodemailer.createTransport({
                host: config.getOrThrow('SMTP_HOST'),
                port: config.getOrThrow('SMTP_PORT'),
                secure: config.get('SMTP_PORT') === 465,
                auth: {
                    user: config.getOrThrow('SMTP_USER'),
                    pass: config.getOrThrow('SMTP_PASS'),
                },
            });
        }
    }
    async sendInvite(to, inviteUrl, orgName, inviterName) {
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
    async sendPasswordReset(to, resetUrl) {
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
    async sendWelcome(to, firstName, orgName) {
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
    async sendTaskReminder(to, assigneeName, taskTitle, dueAt, orgName) {
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
    async send(to, subject, html) {
        if (this.isDev) {
            this.logger.log(`[DEV] Email not sent (NODE_ENV !== production). Would have sent:\n` +
                `  To: ${to}\n` +
                `  Subject: ${subject}\n`);
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
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${to}: ${err.message}`);
            throw err;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
//# sourceMappingURL=mail.service.js.map