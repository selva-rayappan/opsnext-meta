import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * UsersModule — user management, invitations, RBAC lifecycle.
 *
 * Exports UsersService so AuthModule and other feature modules can inject it
 * without creating a circular dependency.
 */
@Module({
  imports: [
    ConfigModule,    // for ConfigService used by UsersService (APP_URL etc.)
    PrismaModule,    // provides PrismaService + TenantPrismaService
    AuditModule,     // global, but explicit import documents the dependency
    MailModule,      // for invite / welcome emails
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
