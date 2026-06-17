import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [PipelinesService],
  controllers: [PipelinesController],
  exports: [PipelinesService],
})
export class PipelinesModule {}
