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
exports.EmailTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let EmailTemplatesService = class EmailTemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(orgId, userId) {
        return this.prisma.emailTemplate.findMany({
            where: {
                organizationId: orgId,
                OR: [{ isShared: true }, { createdById: userId }],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async create(dto, userId, orgId) {
        return this.prisma.emailTemplate.create({
            data: {
                organizationId: orgId,
                createdById: userId,
                name: dto.name,
                subject: dto.subject,
                bodyHtml: dto.bodyHtml,
                isShared: dto.isShared ?? true,
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async update(id, dto, userId, orgId, role) {
        const template = await this.prisma.emailTemplate.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Email template ${id} not found`);
        }
        if (template.createdById !== userId && role !== client_1.Role.ADMIN && role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to update this template');
        }
        return this.prisma.emailTemplate.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.subject !== undefined && { subject: dto.subject }),
                ...(dto.bodyHtml !== undefined && { bodyHtml: dto.bodyHtml }),
                ...(dto.isShared !== undefined && { isShared: dto.isShared }),
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async remove(id, userId, orgId, role) {
        const template = await this.prisma.emailTemplate.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Email template ${id} not found`);
        }
        if (template.createdById !== userId && role !== client_1.Role.ADMIN && role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to delete this template');
        }
        await this.prisma.emailTemplate.delete({ where: { id } });
        return { success: true };
    }
};
exports.EmailTemplatesService = EmailTemplatesService;
exports.EmailTemplatesService = EmailTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailTemplatesService);
//# sourceMappingURL=email-templates.service.js.map