import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare class TasksProcessor {
    private readonly prisma;
    private readonly mail;
    private readonly logger;
    constructor(prisma: PrismaService, mail: MailService);
    checkDueReminders(job: Job): Promise<{
        processed: number;
    }>;
}
