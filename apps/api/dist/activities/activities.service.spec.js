"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const activities_service_1 = require("./activities.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
describe('ActivitiesService', () => {
    let service;
    let prisma;
    const mockActivity = {
        id: 'act-1',
        organizationId: 'org-1',
        userId: 'user-1',
        type: client_1.ActivityType.CALL,
        subject: 'Follow-up Call',
        body: 'Spoke with lead',
        dueAt: new Date(),
        completedAt: new Date(),
        duration: 10,
        outcome: 'Connected',
        contactId: 'contact-1',
        accountId: 'account-1',
        createdAt: new Date(),
    };
    const mockPrisma = {
        activity: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        contact: {
            findFirst: jest.fn(),
        },
        account: {
            findFirst: jest.fn(),
        },
        lead: {
            findFirst: jest.fn(),
        },
        opportunity: {
            findFirst: jest.fn(),
        },
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                activities_service_1.ActivitiesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
            ],
        }).compile();
        service = module.get(activities_service_1.ActivitiesService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('should query and filter activities', async () => {
            prisma.activity.count.mockResolvedValue(1);
            prisma.activity.findMany.mockResolvedValue([mockActivity]);
            const result = await service.findAll('org-1', { page: 1, limit: 10 }, client_1.Role.ADMIN, 'user-1');
            expect(result.data).toEqual([mockActivity]);
            expect(prisma.activity.findMany).toHaveBeenCalled();
        });
        it('should restrict query to own activities for SALES_REP', async () => {
            prisma.activity.count.mockResolvedValue(0);
            prisma.activity.findMany.mockResolvedValue([]);
            await service.findAll('org-1', { page: 1, limit: 10 }, client_1.Role.SALES_REP, 'user-1');
            expect(prisma.activity.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    userId: 'user-1',
                }),
            }));
        });
    });
    describe('create', () => {
        it('should fail if no entity is linked', async () => {
            await expect(service.create({ type: client_1.ActivityType.CALL, subject: 'Call' }, 'user-1', 'org-1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should create new activity successfully', async () => {
            prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' });
            prisma.activity.create.mockResolvedValue(mockActivity);
            const result = await service.create({ type: client_1.ActivityType.CALL, subject: 'Follow-up Call', contactId: 'contact-1' }, 'user-1', 'org-1');
            expect(result).toEqual(mockActivity);
            expect(prisma.activity.create).toHaveBeenCalled();
        });
    });
    describe('delete', () => {
        it('should throw ForbiddenException for SALES_REP', async () => {
            prisma.activity.findFirst.mockResolvedValue(mockActivity);
            await expect(service.delete('act-1', 'user-1', 'org-1', client_1.Role.SALES_REP)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should delete activity successfully for ADMIN', async () => {
            prisma.activity.findFirst.mockResolvedValue(mockActivity);
            prisma.activity.delete.mockResolvedValue(mockActivity);
            const result = await service.delete('act-1', 'user-1', 'org-1', client_1.Role.ADMIN);
            expect(result.success).toBe(true);
            expect(prisma.activity.delete).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=activities.service.spec.js.map