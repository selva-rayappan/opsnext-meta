import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    private readonly appUrl;
    private readonly isDev;
    constructor(config: ConfigService);
    sendInvite(to: string, inviteUrl: string, orgName: string, inviterName: string): Promise<void>;
    sendPasswordReset(to: string, resetUrl: string): Promise<void>;
    sendWelcome(to: string, firstName: string, orgName: string): Promise<void>;
    sendTaskReminder(to: string, assigneeName: string, taskTitle: string, dueAt: Date, orgName: string): Promise<void>;
    private send;
}
