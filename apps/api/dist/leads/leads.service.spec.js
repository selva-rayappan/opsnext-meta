"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const leads_service_1 = require("./leads.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('LeadsService', () => {
    let service;
    let prisma;
    let audit;
    const mockLead = {
        id: 'lead-1',
        organizationId: 'org-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        company: 'Acme Corp',
        source: 'Web',
        status: client_1.LeadStatus.NEW,
        score: 50,
        ownerId: 'user-1',
        notes: 'Some notes',
        convertedAt: null,
        convertedContactId: null,
        convertedOpportunityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
            id: 'user-1',
            firstName: 'Sales',
            lastName: 'Rep',
        },
    };
    const mockPrisma = {
        lead: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        contact: {
            create: jest.fn(),
        },
        opportunity: {
            create: jest.fn(),
        },
        pipeline: {
            findFirst: jest.fn(),
        },
        stage: {
            findFirst: jest.fn(),
        },
        $transaction: jest.fn((cb) => cb(mockPrisma)),
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                leads_service_1.LeadsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
            ],
        }).compile();
        service = module.get(leads_service_1.LeadsService);
        prisma = module.get(prisma_service_1.PrismaService);
        audit = module.get(audit_service_1.AuditService);
        jest.clearAllMocks();
        for (const key of Object.keys(mockPrisma)) {
            if (key === '$transaction')
                continue;
            const model = mockPrisma[key];
            for (const method of Object.keys(model)) {
                if (typeof model[method].mockReset === 'function') {
                    model[method].mockReset();
                }
            }
        }
    });
    describe('findAll', () => {
        it('should return paginated leads', async () => {
            prisma.lead.count.mockResolvedValue(1);
            prisma.lead.findMany.mockResolvedValue([mockLead]);
            const result = await service.findAll('org-1', { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' }, 'ADMIN', 'user-1');
            expect(result.data).toEqual([mockLead]);
            expect(result.total).toBe(1);
            expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ organizationId: 'org-1' }),
            }));
        });
        it('should scope search to owner for Sales Rep role', async () => {
            prisma.lead.count.mockResolvedValue(0);
            prisma.lead.findMany.mockResolvedValue([]);
            await service.findAll('org-1', { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' }, 'SALES_REP', 'user-1');
            expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    organizationId: 'org-1',
                    ownerId: 'user-1',
                }),
            }));
        });
    });
    describe('findById', () => {
        it('should return a lead if found', async () => {
            prisma.lead.findFirst.mockResolvedValue(mockLead);
            const result = await service.findById('lead-1', 'org-1');
            expect(result).toEqual(mockLead);
        });
        it('should throw NotFoundException if lead not found', async () => {
            prisma.lead.findFirst.mockResolvedValue(null);
            await expect(service.findById('lead-1', 'org-1')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('create', () => {
        it('should create a lead and write audit log', async () => {
            prisma.lead.create.mockResolvedValue(mockLead);
            const dto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
            };
            const result = await service.create(dto, 'user-1', 'org-1');
            expect(result).toEqual(mockLead);
            expect(prisma.lead.create).toHaveBeenCalled();
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_CREATED',
            }));
        });
    });
    describe('update', () => {
        it('should update a lead', async () => {
            prisma.lead.findFirst.mockResolvedValue(mockLead);
            prisma.lead.update.mockResolvedValue({ ...mockLead, firstName: 'Johnny' });
            const result = await service.update('lead-1', { firstName: 'Johnny' }, 'user-1', 'org-1');
            expect(result.firstName).toBe('Johnny');
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_UPDATED',
            }));
        });
    });
    describe('delete', () => {
        it('should delete a lead', async () => {
            prisma.lead.findFirst.mockResolvedValue(mockLead);
            prisma.lead.delete.mockResolvedValue(mockLead);
            await service.delete('lead-1', 'user-1', 'org-1');
            expect(prisma.lead.delete).toHaveBeenCalled();
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_DELETED',
            }));
        });
    });
    describe('changeStatus', () => {
        it('should throw BadRequestException if changing to CONVERTED', async () => {
            await expect(service.changeStatus('lead-1', client_1.LeadStatus.CONVERTED, 'user-1', 'org-1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should update status and audit log', async () => {
            prisma.lead.findFirst.mockResolvedValue(mockLead);
            prisma.lead.update.mockResolvedValue({ ...mockLead, status: client_1.LeadStatus.CONTACTED });
            const result = await service.changeStatus('lead-1', client_1.LeadStatus.CONTACTED, 'user-1', 'org-1');
            expect(result.status).toBe(client_1.LeadStatus.CONTACTED);
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_STATUS_CHANGED',
            }));
        });
    });
    describe('convert', () => {
        it('should convert lead to contact and optional opportunity', async () => {
            prisma.lead.findFirst.mockResolvedValue(mockLead);
            const mockContact = { id: 'contact-1', firstName: 'John', lastName: 'Doe' };
            const mockOpportunity = { id: 'opp-1', name: 'Acme Deal', amount: 100000n };
            prisma.contact.create.mockResolvedValue(mockContact);
            prisma.pipeline.findFirst.mockResolvedValue({ id: 'pipeline-1' });
            prisma.stage.findFirst.mockResolvedValue({ id: 'stage-1' });
            prisma.opportunity.create.mockResolvedValue(mockOpportunity);
            prisma.lead.update.mockResolvedValue({
                ...mockLead,
                status: client_1.LeadStatus.CONVERTED,
                convertedContactId: 'contact-1',
                convertedOpportunityId: 'opp-1',
            });
            const result = await service.convert('lead-1', { createOpportunity: true, opportunityTitle: 'Acme Deal', amount: 1000 }, 'user-1', 'org-1');
            expect(result.lead.status).toBe(client_1.LeadStatus.CONVERTED);
            expect(result.contact.id).toBe('contact-1');
            expect(result.opportunity.id).toBe('opp-1');
            expect(result.opportunity.amount).toBe(1000);
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_CONVERTED',
            }));
        });
    });
    describe('bulkImport', () => {
        it('should import new leads and skip duplicates', async () => {
            prisma.lead.findMany.mockResolvedValue([{ email: 'existing@example.com' }]);
            prisma.lead.create.mockResolvedValue(mockLead);
            const result = await service.bulkImport([
                { firstName: 'New', lastName: 'User', email: 'new@example.com' },
                { firstName: 'Existing', lastName: 'User', email: 'existing@example.com' },
                { firstName: '', lastName: 'Invalid' },
            ], 'user-1', 'org-1');
            expect(result.created).toBe(1);
            expect(result.skipped).toBe(1);
            expect(result.errors.length).toBe(1);
            expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'LEAD_BULK_IMPORT',
            }));
        });
    });
});
//# sourceMappingURL=leads.service.spec.js.map