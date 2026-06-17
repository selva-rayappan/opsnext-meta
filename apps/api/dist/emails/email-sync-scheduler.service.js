"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailSyncSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSyncSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
let EmailSyncSchedulerService = EmailSyncSchedulerService_1 = class EmailSyncSchedulerService {
    constructor(emailSyncQueue) {
        this.emailSyncQueue = emailSyncQueue;
        this.logger = new common_1.Logger(EmailSyncSchedulerService_1.name);
    }
    async onModuleInit() {
        const repeatableJobs = await this.emailSyncQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            if (job.name === 'check-email-sync') {
                await this.emailSyncQueue.removeRepeatableByKey(job.key);
                this.logger.debug(`Removed stale repeatable job: ${job.key}`);
            }
        }
        await this.emailSyncQueue.add('check-email-sync', {}, {
            repeat: { cron: '*/5 * * * *' },
            removeOnComplete: true,
            removeOnFail: 50,
        });
        this.logger.log('Email IMAP sync job scheduled (every 5 minutes)');
    }
};
exports.EmailSyncSchedulerService = EmailSyncSchedulerService;
exports.EmailSyncSchedulerService = EmailSyncSchedulerService = EmailSyncSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('email-sync')),
    __metadata("design:paramtypes", [Object])
], EmailSyncSchedulerService);
//# sourceMappingURL=email-sync-scheduler.service.js.map