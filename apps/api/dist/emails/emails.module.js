"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("../prisma/prisma.module");
const email_integrations_module_1 = require("../email-integrations/email-integrations.module");
const emails_controller_1 = require("./emails.controller");
const emails_service_1 = require("./emails.service");
const email_sync_processor_1 = require("./email-sync.processor");
const email_sync_scheduler_service_1 = require("./email-sync-scheduler.service");
let EmailsModule = class EmailsModule {
};
exports.EmailsModule = EmailsModule;
exports.EmailsModule = EmailsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            email_integrations_module_1.EmailIntegrationsModule,
            bull_1.BullModule.registerQueue({ name: 'email-sync' }),
        ],
        controllers: [emails_controller_1.EmailsController],
        providers: [emails_service_1.EmailsService, email_sync_processor_1.EmailSyncProcessor, email_sync_scheduler_service_1.EmailSyncSchedulerService],
        exports: [emails_service_1.EmailsService],
    })
], EmailsModule);
//# sourceMappingURL=emails.module.js.map