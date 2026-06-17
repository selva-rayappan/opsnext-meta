import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [OpportunitiesService],
  controllers: [OpportunitiesController],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
