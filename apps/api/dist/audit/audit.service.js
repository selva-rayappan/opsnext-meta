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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(params) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    organizationId: params.organizationId,
                    actorId: params.actorId ?? null,
                    actorRole: params.actorRole ?? null,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId ?? null,
                    before: params.before !== undefined ? params.before : client_1.Prisma.JsonNull,
                    after: params.after !== undefined ? params.after : client_1.Prisma.JsonNull,
                    ipAddress: params.ipAddress ?? null,
                    userAgent: params.userAgent ?? null,
                },
            });
        }
        catch (err) {
            process.stderr.write(`[AuditService] Failed to write audit log: ${err.message}\n` +
                `  params: ${JSON.stringify({ action: params.action, entityType: params.entityType, entityId: params.entityId })}\n`);
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map