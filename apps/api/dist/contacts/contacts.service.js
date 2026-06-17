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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const CONTACT_INCLUDE = {
    owner: { select: { id: true, firstName: true, lastName: true } },
    accountLinks: {
        include: { account: { select: { id: true, name: true } } },
    },
    tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
};
let ContactsService = class ContactsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId, query) {
        const { page, limit, q, isActive, ownerId, tagId, sortBy, order } = query;
        const where = { organizationId: orgId };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (ownerId !== undefined) {
            where.ownerId = ownerId;
        }
        if (tagId !== undefined) {
            where.tags = { some: { tagId } };
        }
        if (q && q.trim().length > 0) {
            const term = q.trim();
            where.OR = [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.contact.findMany({
                where,
                orderBy: { [sortBy]: order },
                skip: (page - 1) * limit,
                take: limit,
                include: CONTACT_INCLUDE,
            }),
            this.prisma.contact.count({ where }),
        ]);
        return { data: data, total, page, limit };
    }
    async findById(id, orgId) {
        const contact = await this.prisma.contact.findFirst({
            where: { id, organizationId: orgId },
            include: CONTACT_INCLUDE,
        });
        if (!contact) {
            throw new common_1.NotFoundException(`Contact ${id} not found`);
        }
        return contact;
    }
    async create(dto, actorId, orgId) {
        if (dto.email) {
            const duplicate = await this.prisma.contact.findFirst({
                where: { organizationId: orgId, email: dto.email },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`A contact with email ${dto.email} already exists in this organization`);
            }
        }
        const contact = await this.prisma.contact.create({
            data: {
                organizationId: orgId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email ?? null,
                phone: dto.phone ?? null,
                title: dto.title ?? null,
                source: dto.source ?? null,
                notes: dto.notes ?? null,
                ownerId: dto.ownerId ?? null,
            },
            include: CONTACT_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'CONTACT_CREATED',
            entityType: 'Contact',
            entityId: contact.id,
            after: {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
            },
        });
        return contact;
    }
    async update(id, dto, actorId, orgId) {
        const existing = await this.findById(id, orgId);
        if (dto.email && dto.email !== existing.email) {
            const duplicate = await this.prisma.contact.findFirst({
                where: {
                    organizationId: orgId,
                    email: dto.email,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`A contact with email ${dto.email} already exists in this organization`);
            }
        }
        const before = {
            firstName: existing.firstName,
            lastName: existing.lastName,
            email: existing.email,
            phone: existing.phone,
            title: existing.title,
            source: existing.source,
            ownerId: existing.ownerId,
        };
        const contact = await this.prisma.contact.update({
            where: { id },
            data: {
                ...(dto.firstName !== undefined && { firstName: dto.firstName }),
                ...(dto.lastName !== undefined && { lastName: dto.lastName }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.source !== undefined && { source: dto.source }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
            },
            include: CONTACT_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'CONTACT_UPDATED',
            entityType: 'Contact',
            entityId: id,
            before,
            after: {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                title: contact.title,
                source: contact.source,
                ownerId: contact.ownerId,
            },
        });
        return contact;
    }
    async softDelete(id, actorId, orgId) {
        await this.findById(id, orgId);
        await this.prisma.contact.update({
            where: { id },
            data: { isActive: false },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'CONTACT_DELETED',
            entityType: 'Contact',
            entityId: id,
            after: { isActive: false },
        });
    }
    async merge(sourceId, targetId, actorId, orgId) {
        if (sourceId === targetId) {
            throw new common_1.BadRequestException('Source and target contact must be different');
        }
        await this.findById(sourceId, orgId);
        const target = await this.findById(targetId, orgId);
        await this.prisma.contact.update({
            where: { id: sourceId },
            data: { isActive: false, mergedIntoId: targetId },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'CONTACT_MERGED',
            entityType: 'Contact',
            entityId: sourceId,
            after: { mergedIntoId: targetId, isActive: false },
        });
        return target;
    }
    async bulkImport(contacts, actorId, orgId) {
        const result = { created: 0, skipped: 0, errors: [] };
        const emailsToCheck = contacts
            .map((c) => c.email?.toLowerCase())
            .filter((e) => !!e);
        const existingEmails = new Set();
        if (emailsToCheck.length > 0) {
            const existing = await this.prisma.contact.findMany({
                where: {
                    organizationId: orgId,
                    email: { in: emailsToCheck },
                },
                select: { email: true },
            });
            existing.forEach((c) => {
                if (c.email)
                    existingEmails.add(c.email.toLowerCase());
            });
        }
        const batchEmails = new Set();
        for (let i = 0; i < contacts.length; i++) {
            const row = contacts[i];
            if (!row.firstName?.trim() || !row.lastName?.trim()) {
                result.errors.push({ index: i, reason: 'firstName and lastName are required' });
                continue;
            }
            const normalizedEmail = row.email?.toLowerCase();
            if (normalizedEmail) {
                if (existingEmails.has(normalizedEmail) || batchEmails.has(normalizedEmail)) {
                    result.skipped++;
                    continue;
                }
                batchEmails.add(normalizedEmail);
            }
            try {
                await this.prisma.contact.create({
                    data: {
                        organizationId: orgId,
                        firstName: row.firstName.trim(),
                        lastName: row.lastName.trim(),
                        email: normalizedEmail ?? null,
                        phone: row.phone ?? null,
                        source: row.source ?? null,
                    },
                });
                result.created++;
            }
            catch (err) {
                result.errors.push({
                    index: i,
                    reason: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'CONTACT_BULK_IMPORT',
            entityType: 'Contact',
            after: {
                created: result.created,
                skipped: result.skipped,
                errors: result.errors.length,
            },
        });
        return result;
    }
    async linkAccount(contactId, accountId, orgId, title, isPrimary) {
        await this.findById(contactId, orgId);
        const account = await this.prisma.account.findFirst({
            where: { id: accountId, organizationId: orgId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Account ${accountId} not found`);
        }
        await this.prisma.contactAccountLink.upsert({
            where: { contactId_accountId: { contactId, accountId } },
            create: {
                contactId,
                accountId,
                title: title ?? null,
                isPrimary: isPrimary ?? false,
            },
            update: {
                title: title ?? null,
                isPrimary: isPrimary ?? false,
            },
        });
    }
    async unlinkAccount(contactId, accountId, orgId) {
        await this.findById(contactId, orgId);
        await this.prisma.contactAccountLink.deleteMany({
            where: { contactId, accountId },
        });
    }
    async addTag(contactId, tagId, orgId) {
        await this.findById(contactId, orgId);
        const tag = await this.prisma.tag.findFirst({
            where: { id: tagId, organizationId: orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException(`Tag ${tagId} not found`);
        }
        await this.prisma.contactTag.upsert({
            where: { contactId_tagId: { contactId, tagId } },
            create: { contactId, tagId },
            update: {},
        });
    }
    async removeTag(contactId, tagId, orgId) {
        await this.findById(contactId, orgId);
        await this.prisma.contactTag.deleteMany({
            where: { contactId, tagId },
        });
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map