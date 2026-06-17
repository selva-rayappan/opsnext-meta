import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailIntegrationsController } from './email-integrations.controller';
import { EmailIntegrationsService } from './email-integrations.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailIntegrationsController],
  providers: [EmailIntegrationsService],
  exports: [EmailIntegrationsService],
})
export class EmailIntegrationsModule {}
