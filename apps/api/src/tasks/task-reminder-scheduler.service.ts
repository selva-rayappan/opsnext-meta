import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Schedules a recurring Bull job that fires every 30 minutes to check
 * for tasks due within the next hour and dispatch email reminders.
 */
@Injectable()
export class TaskReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TaskReminderSchedulerService.name);

  constructor(@InjectQueue('tasks') private readonly tasksQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    // Remove any stale repeating jobs from previous boots to avoid duplicates
    const repeatableJobs = await this.tasksQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === 'check-due-reminders') {
        await this.tasksQueue.removeRepeatableByKey(job.key);
        this.logger.debug(`Removed stale repeatable job: ${job.key}`);
      }
    }

    // Schedule the reminder check every 30 minutes
    await this.tasksQueue.add(
      'check-due-reminders',
      {},
      {
        repeat: { cron: '*/30 * * * *' },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );

    this.logger.log('Task due-date reminder job scheduled (every 30 minutes)');
  }
}
