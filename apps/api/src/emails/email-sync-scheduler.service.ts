import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Schedules a recurring Bull job that fires every 5 minutes to check all
 * active IMAP integrations and enqueue sync-org jobs for each.
 */
@Injectable()
export class EmailSyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(EmailSyncSchedulerService.name);

  constructor(@InjectQueue('email-sync') private readonly emailSyncQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    // Remove any stale repeatable jobs from previous boots to avoid duplicates
    const repeatableJobs = await this.emailSyncQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === 'check-email-sync') {
        await this.emailSyncQueue.removeRepeatableByKey(job.key);
        this.logger.debug(`Removed stale repeatable job: ${job.key}`);
      }
    }

    // Schedule the IMAP sync check every 5 minutes
    await this.emailSyncQueue.add(
      'check-email-sync',
      {},
      {
        repeat: { cron: '*/5 * * * *' },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );

    this.logger.log('Email IMAP sync job scheduled (every 5 minutes)');
  }
}
