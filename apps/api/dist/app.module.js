"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const organizations_module_1 = require("./organizations/organizations.module");
const audit_module_1 = require("./audit/audit.module");
const contacts_module_1 = require("./contacts/contacts.module");
const accounts_module_1 = require("./accounts/accounts.module");
const tags_module_1 = require("./tags/tags.module");
const custom_fields_module_1 = require("./custom-fields/custom-fields.module");
const leads_module_1 = require("./leads/leads.module");
const pipelines_module_1 = require("./pipelines/pipelines.module");
const opportunities_module_1 = require("./opportunities/opportunities.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const tenant_middleware_1 = require("./common/middleware/tenant.middleware");
const bull_1 = require("@nestjs/bull");
const activities_module_1 = require("./activities/activities.module");
const tasks_module_1 = require("./tasks/tasks.module");
const reports_module_1 = require("./reports/reports.module");
const email_integrations_module_1 = require("./email-integrations/email-integrations.module");
const email_templates_module_1 = require("./email-templates/email-templates.module");
const emails_module_1 = require("./emails/emails.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude({ path: 'api/v1/auth/(.*)', method: common_1.RequestMethod.ALL })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (_config) => ({
                    throttlers: [
                        {
                            ttl: 60_000,
                            limit: 300,
                        },
                    ],
                }),
            }),
            prisma_module_1.PrismaModule,
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    redis: config.get('REDIS_URL', 'redis://localhost:6379'),
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
            audit_module_1.AuditModule,
            contacts_module_1.ContactsModule,
            accounts_module_1.AccountsModule,
            tags_module_1.TagsModule,
            custom_fields_module_1.CustomFieldsModule,
            leads_module_1.LeadsModule,
            pipelines_module_1.PipelinesModule,
            opportunities_module_1.OpportunitiesModule,
            activities_module_1.ActivitiesModule,
            tasks_module_1.TasksModule,
            reports_module_1.ReportsModule,
            email_integrations_module_1.EmailIntegrationsModule,
            email_templates_module_1.EmailTemplatesModule,
            emails_module_1.EmailsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map