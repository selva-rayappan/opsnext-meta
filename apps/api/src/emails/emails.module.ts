import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailIntegrationsModule } from '../email-integrations/email-integrations.module';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailSyncProcessor } from './email-sync.processor';
import { EmailSyncSchedulerService } from './email-sync-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    EmailIntegrationsModule,
    BullModule.registerQueue({ name: 'email-sync' }),
  ],
  controllers: [EmailsController],
  providers: [EmailsService, EmailSyncProcessor, EmailSyncSchedulerService],
  exports: [EmailsService],
})
export class EmailsModule {}
