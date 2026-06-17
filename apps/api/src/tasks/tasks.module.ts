import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksProcessor } from './tasks.processor';
import { TaskReminderSchedulerService } from './task-reminder-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    MailModule,
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksProcessor, TaskReminderSchedulerService],
  exports: [TasksService],
})
export class TasksModule {}
