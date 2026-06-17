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
var TasksProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const client_1 = require("@prisma/client");
let TasksProcessor = TasksProcessor_1 = class TasksProcessor {
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
        this.logger = new common_1.Logger(TasksProcessor_1.name);
    }
    async checkDueReminders(job) {
        this.logger.log('Checking for overdue tasks due soon...');
        const now = new Date();
        const futureLimit = new Date(now.getTime() + 60 * 60 * 1000);
        const tasksDue = await this.prisma.task.findMany({
            where: {
                status: { in: [client_1.TaskStatus.OPEN, client_1.TaskStatus.IN_PROGRESS] },
                dueAt: {
                    gt: now,
                    lte: futureLimit,
                },
            },
            include: {
                assignee: true,
                organization: true,
            },
        });
        this.logger.log(`Found ${tasksDue.length} tasks due in the next hour.`);
        for (const task of tasksDue) {
            try {
                if (task.assignee?.email && task.dueAt) {
                    await this.mail.sendTaskReminder(task.assignee.email, task.assignee.firstName, task.title, task.dueAt, task.organization.name || 'OpsNext CRM');
                    this.logger.log(`Reminder sent for Task ${task.id} to ${task.assignee.email}`);
                }
            }
            catch (err) {
                this.logger.error(`Failed to send reminder for Task ${task.id}: ${err.message}`);
            }
        }
        return { processed: tasksDue.length };
    }
};
exports.TasksProcessor = TasksProcessor;
__decorate([
    (0, bull_1.Process)('check-due-reminders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksProcessor.prototype, "checkDueReminders", null);
exports.TasksProcessor = TasksProcessor = TasksProcessor_1 = __decorate([
    (0, bull_1.Processor)('tasks'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], TasksProcessor);
//# sourceMappingURL=tasks.processor.js.map