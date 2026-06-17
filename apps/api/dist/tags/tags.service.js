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
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const DEFAULT_COLOR = '#6B7280';
let TagsService = class TagsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId) {
        return this.prisma.tag.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' },
        });
    }
    async create(dto, orgId, actorId) {
        const existing = await this.prisma.tag.findFirst({
            where: { organizationId: orgId, name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`A tag named "${dto.name}" already exists in this organization`);
        }
        const tag = await this.prisma.tag.create({
            data: {
                organizationId: orgId,
                name: dto.name,
                color: dto.color ?? DEFAULT_COLOR,
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'TAG_CREATED',
            entityType: 'Tag',
            entityId: tag.id,
            after: { name: tag.name, color: tag.color },
        });
        return tag;
    }
    async update(id, dto, orgId, actorId) {
        const existing = await this.prisma.tag.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Tag ${id} not found`);
        }
        if (dto.name && dto.name !== existing.name) {
            const duplicate = await this.prisma.tag.findFirst({
                where: { organizationId: orgId, name: dto.name, NOT: { id } },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`A tag named "${dto.name}" already exists in this organization`);
            }
        }
        const tag = await this.prisma.tag.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.color !== undefined && { color: dto.color }),
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'TAG_UPDATED',
            entityType: 'Tag',
            entityId: id,
            before: { name: existing.name, color: existing.color },
            after: { name: tag.name, color: tag.color },
        });
        return tag;
    }
    async delete(id, orgId, actorId) {
        const existing = await this.prisma.tag.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Tag ${id} not found`);
        }
        await this.prisma.tag.delete({ where: { id } });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'TAG_DELETED',
            entityType: 'Tag',
            entityId: id,
            before: { name: existing.name, color: existing.color },
        });
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TagsService);
//# sourceMappingURL=tags.service.js.map