import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditModule } from './audit/audit.module';
import { ContactsModule } from './contacts/contacts.module';
import { AccountsModule } from './accounts/accounts.module';
import { TagsModule } from './tags/tags.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { LeadsModule } from './leads/leads.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    // Global configuration — reads from process.env / .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting — memory-backed for simplicity; swap storage for Redis in production
    // by adding @nest-lab/throttler-storage-redis as a dependency.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_config: ConfigService) => ({
        throttlers: [
          {
            // 300 API calls per minute per tenant (enforced via ThrottlerGuard)
            ttl: 60_000,
            limit: 300,
          },
        ],
      }),
    }),

    // Global Prisma module (provides PrismaService + TenantPrismaService everywhere)
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,

    // EP-02: Contact & Account Management
    ContactsModule,
    AccountsModule,
    TagsModule,
    CustomFieldsModule,

    // EP-03: Lead Management
    LeadsModule,
  ],
  providers: [
    // Apply rate-limiting guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply JWT authentication guard globally (routes opt-out with @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply RBAC roles guard globally (routes must declare @Roles() or throw ForbiddenException)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Apply TenantMiddleware to all routes EXCEPT /auth/*.
   * The middleware reads req.user (set by Passport) and seeds the
   * TenantContext AsyncLocalStorage for the current request lifecycle.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
