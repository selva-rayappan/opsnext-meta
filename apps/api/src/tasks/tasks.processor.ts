import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TaskStatus } from '@prisma/client';

@Processor('tasks')
export class TasksProcessor {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Process('check-due-reminders')
  async checkDueReminders(job: Job) {
    this.logger.log('Checking for overdue tasks due soon...');

    const now = new Date();
    const futureLimit = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    const tasksDue = await this.prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        dueAt: {
          gt: now,
          lte: futureLimit,
        },
      },
      include: {
        assignee: true,
        organization: true,
      },
    });

    this.logger.log(`Found ${tasksDue.length} tasks due in the next hour.`);

    for (const task of tasksDue) {
      try {
        if (task.assignee?.email && task.dueAt) {
          await this.mail.sendTaskReminder(
            task.assignee.email,
            task.assignee.firstName,
            task.title,
            task.dueAt,
            task.organization.name || 'OpsNext CRM',
          );
          this.logger.log(`Reminder sent for Task ${task.id} to ${task.assignee.email}`);
        }
      } catch (err) {
        this.logger.error(`Failed to send reminder for Task ${task.id}: ${(err as Error).message}`);
      }
    }

    return { processed: tasksDue.length };
  }
}
