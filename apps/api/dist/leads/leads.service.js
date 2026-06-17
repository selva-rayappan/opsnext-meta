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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shared_1 = require("@opsnext/shared");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const LEAD_INCLUDE = {
    owner: { select: { id: true, firstName: true, lastName: true } },
};
let LeadsService = class LeadsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId, query, userRole, userId) {
        const { page, limit, q, status, ownerId, sortBy, order } = query;
        const where = { organizationId: orgId };
        if (userRole === shared_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        else if (ownerId !== undefined) {
            where.ownerId = ownerId;
        }
        if (status !== undefined) {
            where.status = status;
        }
        if (q && q.trim().length > 0) {
            const term = q.trim();
            where.OR = [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { company: { contains: term, mode: 'insensitive' } },
            ];
        }
        const orderBy = { [sortBy]: order };
        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                include: LEAD_INCLUDE,
            }),
            this.prisma.lead.count({ where }),
        ]);
        return { data: data, total, page, limit };
    }
    async findById(id, orgId) {
        const lead = await this.prisma.lead.findFirst({
            where: { id, organizationId: orgId },
            include: LEAD_INCLUDE,
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead ${id} not found`);
        }
        return lead;
    }
    async create(dto, actorId, orgId) {
        const lead = await this.prisma.lead.create({
            data: {
                organizationId: orgId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email ?? null,
                phone: dto.phone ?? null,
                company: dto.company ?? null,
                source: dto.source ?? null,
                status: dto.status ?? client_1.LeadStatus.NEW,
                score: dto.score ?? 0,
                ownerId: dto.ownerId ?? null,
                notes: dto.notes ?? null,
            },
            include: LEAD_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'LEAD_CREATED',
            entityType: 'Lead',
            entityId: lead.id,
            after: {
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                status: lead.status,
            },
        });
        return lead;
    }
    async update(id, dto, actorId, orgId) {
        const existing = await this.findById(id, orgId);
        const before = {
            firstName: existing.firstName,
            lastName: existing.lastName,
            email: existing.email,
            phone: existing.phone,
            company: existing.company,
            source: existing.source,
            status: existing.status,
            score: existing.score,
            ownerId: existing.ownerId,
        };
        const lead = await this.prisma.lead.update({
            where: { id },
            data: {
                ...(dto.firstName !== undefined && { firstName: dto.firstName }),
                ...(dto.lastName !== undefined && { lastName: dto.lastName }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.company !== undefined && { company: dto.company }),
                ...(dto.source !== undefined && { source: dto.source }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.score !== undefined && { score: dto.score }),
                ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
            include: LEAD_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'LEAD_UPDATED',
            entityType: 'Lead',
            entityId: id,
            before,
            after: {
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
                source: lead.source,
                status: lead.status,
                score: lead.score,
                ownerId: lead.ownerId,
            },
        });
        return lead;
    }
    async delete(id, actorId, orgId) {
        await this.findById(id, orgId);
        await this.prisma.lead.delete({ where: { id } });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'LEAD_DELETED',
            entityType: 'Lead',
            entityId: id,
        });
    }
    async changeStatus(id, status, actorId, orgId) {
        if (status === client_1.LeadStatus.CONVERTED) {
            throw new common_1.BadRequestException('Cannot set status to CONVERTED directly. Use the convert endpoint instead.');
        }
        const existing = await this.findById(id, orgId);
        const lead = await this.prisma.lead.update({
            where: { id },
            data: { status },
            include: LEAD_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'LEAD_STATUS_CHANGED',
            entityType: 'Lead',
            entityId: id,
            before: { status: existing.status },
            after: { status: lead.status },
        });
        return lead;
    }
    async convert(id, dto, actorId, orgId) {
        const existingLead = await this.findById(id, orgId);
        if (existingLead.status === client_1.LeadStatus.CONVERTED) {
            throw new common_1.BadRequestException(`Lead ${id} has already been converted`);
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const contact = await tx.contact.create({
                data: {
                    organizationId: orgId,
                    firstName: existingLead.firstName,
                    lastName: existingLead.lastName,
                    email: existingLead.email ?? null,
                    phone: existingLead.phone ?? null,
                    title: existingLead.company ?? null,
                    source: existingLead.source ?? null,
                    ownerId: existingLead.ownerId ?? null,
                },
            });
            let opportunity;
            if (dto.createOpportunity) {
                let pipelineId = dto.pipelineId;
                if (!pipelineId) {
                    const defaultPipeline = await tx.pipeline.findFirst({
                        where: { organizationId: orgId, isDefault: true },
                        select: { id: true },
                    });
                    if (!defaultPipeline) {
                        throw new common_1.BadRequestException('No default pipeline found. Please provide a pipelineId.');
                    }
                    pipelineId = defaultPipeline.id;
                }
                const firstStage = await tx.stage.findFirst({
                    where: { pipelineId },
                    orderBy: { order: 'asc' },
                    select: { id: true },
                });
                if (!firstStage) {
                    throw new common_1.BadRequestException(`Pipeline ${pipelineId} has no stages. Add stages before converting leads.`);
                }
                opportunity = await tx.opportunity.create({
                    data: {
                        organizationId: orgId,
                        name: dto.opportunityTitle ?? `${existingLead.firstName} ${existingLead.lastName}`,
                        pipelineId,
                        stageId: firstStage.id,
                        contactId: contact.id,
                        ownerId: existingLead.ownerId ?? null,
                        amount: dto.amount !== undefined ? BigInt(Math.round(dto.amount * 100)) : null,
                        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
            }
            const updatedLead = await tx.lead.update({
                where: { id },
                data: {
                    status: client_1.LeadStatus.CONVERTED,
                    convertedAt: new Date(),
                    convertedContactId: contact.id,
                    convertedOpportunityId: opportunity?.id ?? null,
                },
                include: LEAD_INCLUDE,
            });
            let serializedOpportunity = undefined;
            if (opportunity) {
                serializedOpportunity = {
                    ...opportunity,
                    amount: opportunity.amount !== null ? Number(opportunity.amount) / 100 : null,
                };
            }
            return { lead: updatedLead, contact, opportunity: serializedOpportunity };
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'LEAD_CONVERTED',
            entityType: 'Lead',
            entityId: id,
            after: {
                convertedContactId: result.contact.id,
                convertedOpportunityId: result.opportunity?.id ?? null,
            },
        });
        return result;
    }
    async bulkImport(leads, actorId, orgId) {
        const result = { created: 0, skipped: 0, errors: [] };
        const emailsToCheck = leads
            .map((l) => l.email?.toLowerCase())
            .filter((e) => !!e);
        const existingEmails = new Set();
        if (emailsToCheck.length > 0) {
            const existing = await this.prisma.lead.findMany({
                where: {
                    organizationId: orgId,
                    email: { in: emailsToCheck },
                },
                select: { email: true },
            });
            existing.forEach((l) => {
                if (l.email)
                    existingEmails.add(l.email.toLowerCase());
            });
        }
        const batchEmails = new Set();
        for (let i = 0; i < leads.length; i++) {
            const row = leads[i];
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
                await this.prisma.lead.create({
                    data: {
                        organizationId: orgId,
                        firstName: row.firstName.trim(),
                        lastName: row.lastName.trim(),
                        email: normalizedEmail ?? null,
                        phone: row.phone ?? null,
                        company: row.company ?? null,
                        source: row.source ?? null,
                        score: row.score ?? 0,
                        notes: row.notes ?? null,
                        ownerId: row.ownerId ?? null,
                        status: row.status ?? client_1.LeadStatus.NEW,
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
            action: 'LEAD_BULK_IMPORT',
            entityType: 'Lead',
            after: {
                created: result.created,
                skipped: result.skipped,
                errors: result.errors.length,
            },
        });
        return result;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map