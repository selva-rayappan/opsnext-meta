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
exports.CustomFieldsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomFieldsService = class CustomFieldsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(orgId, entityType) {
        return this.prisma.customField.findMany({
            where: {
                organizationId: orgId,
                ...(entityType ? { entityType } : {}),
            },
            orderBy: [{ entityType: 'asc' }, { order: 'asc' }, { name: 'asc' }],
        });
    }
    async create(dto, orgId) {
        if ((dto.fieldType === 'select' || dto.fieldType === 'multiselect') &&
            (!dto.options || dto.options.length === 0)) {
            throw new common_1.BadRequestException(`Field type "${dto.fieldType}" requires at least one option`);
        }
        const existing = await this.prisma.customField.findFirst({
            where: {
                organizationId: orgId,
                entityType: dto.entityType,
                name: dto.name,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A custom field named "${dto.name}" already exists for ${dto.entityType}`);
        }
        return this.prisma.customField.create({
            data: {
                organizationId: orgId,
                entityType: dto.entityType,
                name: dto.name,
                fieldType: dto.fieldType,
                isRequired: dto.isRequired ?? false,
                options: dto.options ? dto.options : client_1.Prisma.JsonNull,
                order: dto.order ?? 0,
            },
        });
    }
    async update(id, dto, orgId) {
        const existing = await this.prisma.customField.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Custom field ${id} not found`);
        }
        if (dto.name && dto.name !== existing.name) {
            const duplicate = await this.prisma.customField.findFirst({
                where: {
                    organizationId: orgId,
                    entityType: existing.entityType,
                    name: dto.name,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`A custom field named "${dto.name}" already exists for ${existing.entityType}`);
            }
        }
        const newFieldType = dto.fieldType ?? existing.fieldType;
        const newOptions = dto.options ?? existing.options;
        if ((newFieldType === 'select' || newFieldType === 'multiselect') &&
            (!newOptions || newOptions.length === 0)) {
            throw new common_1.BadRequestException(`Field type "${newFieldType}" requires at least one option`);
        }
        return this.prisma.customField.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.fieldType !== undefined && { fieldType: dto.fieldType }),
                ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
                ...(dto.options !== undefined && {
                    options: dto.options,
                }),
                ...(dto.order !== undefined && { order: dto.order }),
            },
        });
    }
    async delete(id, orgId) {
        const existing = await this.prisma.customField.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Custom field ${id} not found`);
        }
        await this.prisma.customField.delete({ where: { id } });
    }
    async getValue(fieldId, entityId) {
        return this.prisma.customFieldValue.findFirst({
            where: { fieldId, entityId },
        });
    }
    async setValue(fieldId, entityType, entityId, value, orgId) {
        const field = await this.prisma.customField.findFirst({
            where: { id: fieldId, organizationId: orgId },
        });
        if (!field) {
            throw new common_1.NotFoundException(`Custom field ${fieldId} not found`);
        }
        if (field.entityType !== entityType) {
            throw new common_1.BadRequestException(`Custom field ${fieldId} is for entity type "${field.entityType}", not "${entityType}"`);
        }
        return this.prisma.customFieldValue.upsert({
            where: { fieldId_entityId: { fieldId, entityId } },
            create: {
                fieldId,
                entityType,
                entityId,
                value: value,
            },
            update: {
                value: value,
            },
        });
    }
    async getEntityValues(entityType, entityId, orgId) {
        const fields = await this.prisma.customField.findMany({
            where: { organizationId: orgId, entityType },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
        });
        if (fields.length === 0) {
            return [];
        }
        const storedValues = await this.prisma.customFieldValue.findMany({
            where: {
                entityType,
                entityId,
                fieldId: { in: fields.map((f) => f.id) },
            },
        });
        const valuesByFieldId = new Map(storedValues.map((v) => [v.fieldId, v]));
        return fields.map((field) => ({
            field,
            value: valuesByFieldId.get(field.id) ?? null,
        }));
    }
};
exports.CustomFieldsService = CustomFieldsService;
exports.CustomFieldsService = CustomFieldsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomFieldsService);
//# sourceMappingURL=custom-fields.service.js.map