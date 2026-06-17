"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const opportunities_service_1 = require("./opportunities.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
describe('OpportunitiesService', () => {
    let service;
    let prisma;
    let audit;
    const mockOpp = {
        id: 'opp-1',
        organizationId: 'org-1',
        name: 'Big Deal',
        amount: 150000n,
        currency: 'USD',
        closeDate: new Date('2026-06-30'),
        stageId: 'stage-1',
        pipelineId: 'pipeline-1',
        contactId: 'contact-1',
        accountId: 'account-1',
        ownerId: 'user-1',
        probability: 40,
        status: client_1.OpportunityStatus.OPEN,
        lostReason: null,
        wonAt: null,
        lostAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockStage = {
        id: 'stage-1',
        pipelineId: 'pipeline-1',
        name: 'Discovery',
        probability: 40,
        stageType: client_1.StageType.OPEN,
    };
    const mockPrisma = {
        opportunity: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        pipeline: {
            findFirst: jest.fn(),
        },
        stage: {
            findFirst: jest.fn(),
        },
        contact: {
            findFirst: jest.fn(),
        },
        account: {
            findFirst: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
        },
        stageHistory: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn((cb) => cb(mockPrisma)),
    };
    const mockAudit = {
        log: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                opportunities_service_1.OpportunitiesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
            ],
        }).compile();
        service = module.get(opportunities_service_1.OpportunitiesService);
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
        it('should return opportunities and convert cents BigInt to dollar number', async () => {
            prisma.opportunity.count.mockResolvedValue(1);
            prisma.opportunity.findMany.mockResolvedValue([mockOpp]);
            const result = await service.findAll('org-1', { page: 1, limit: 10, sortBy: 'amount', order: 'desc' }, client_1.Role.ADMIN, 'user-1');
            expect(result.data[0].amount).toBe(1500);
            expect(result.total).toBe(undefined);
            expect(result.meta.total).toBe(1);
        });
        it('should filter by owner for SALES_REP', async () => {
            prisma.opportunity.count.mockResolvedValue(0);
            prisma.opportunity.findMany.mockResolvedValue([]);
            await service.findAll('org-1', { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' }, client_1.Role.SALES_REP, 'rep-1');
            expect(prisma.opportunity.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ ownerId: 'rep-1' }),
            }));
        });
    });
    describe('create', () => {
        it('should create an opportunity and write initial history', async () => {
            prisma.pipeline.findFirst.mockResolvedValue({ id: 'pipeline-1' });
            prisma.stage.findFirst.mockResolvedValue(mockStage);
            prisma.opportunity.create.mockResolvedValue(mockOpp);
            const dto = {
                name: 'Big Deal',
                amount: 1500,
                closeDate: '2026-06-30',
                pipelineId: 'pipeline-1',
                stageId: 'stage-1',
            };
            const result = await service.create(dto, 'user-1', 'org-1');
            expect(result.amount).toBe(1500);
            expect(prisma.opportunity.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    amount: 150000n,
                }),
            }));
            expect(prisma.stageHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    fromStageId: null,
                    toStageId: 'stage-1',
                }),
            }));
        });
    });
    describe('changeStage', () => {
        it('should change stage and write to history', async () => {
            prisma.opportunity.findFirst.mockResolvedValue(mockOpp);
            const newStage = { ...mockStage, id: 'stage-2', probability: 70 };
            prisma.stage.findFirst.mockResolvedValue(newStage);
            prisma.opportunity.update.mockResolvedValue({
                ...mockOpp,
                stageId: 'stage-2',
                probability: 70,
            });
            const result = await service.changeStage('opp-1', 'stage-2', 'user-1', 'org-1');
            expect(result.stageId).toBe('stage-2');
            expect(result.probability).toBe(70);
            expect(prisma.stageHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    fromStageId: 'stage-1',
                    toStageId: 'stage-2',
                }),
            }));
        });
    });
    describe('markWon', () => {
        it('should move to WON stage and set status to WON', async () => {
            prisma.opportunity.findFirst.mockResolvedValue(mockOpp);
            const wonStage = { ...mockStage, id: 'stage-won', stageType: client_1.StageType.WON };
            prisma.stage.findFirst.mockResolvedValue(wonStage);
            prisma.opportunity.update.mockResolvedValue({
                ...mockOpp,
                stageId: 'stage-won',
                probability: 100,
                status: client_1.OpportunityStatus.WON,
                wonAt: new Date(),
            });
            const result = await service.markWon('opp-1', {}, 'user-1', 'org-1');
            expect(result.status).toBe(client_1.OpportunityStatus.WON);
            expect(result.probability).toBe(100);
            expect(prisma.opportunity.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: client_1.OpportunityStatus.WON,
                    wonAt: expect.any(Date),
                }),
            }));
        });
    });
    describe('markLost', () => {
        it('should move to LOST stage and record lostReason', async () => {
            prisma.opportunity.findFirst.mockResolvedValue(mockOpp);
            const lostStage = { ...mockStage, id: 'stage-lost', stageType: client_1.StageType.LOST };
            prisma.stage.findFirst.mockResolvedValue(lostStage);
            prisma.opportunity.update.mockResolvedValue({
                ...mockOpp,
                stageId: 'stage-lost',
                probability: 0,
                status: client_1.OpportunityStatus.LOST,
                lostReason: 'Price too high',
                lostAt: new Date(),
            });
            const result = await service.markLost('opp-1', { lostReason: 'Price too high' }, 'user-1', 'org-1');
            expect(result.status).toBe(client_1.OpportunityStatus.LOST);
            expect(result.lostReason).toBe('Price too high');
        });
    });
    describe('getForecast', () => {
        it('should aggregate total and expected values and group by month', async () => {
            const oppA = { amount: 100000n, probability: 50, closeDate: new Date('2026-06-15') };
            const oppB = { amount: 200000n, probability: 80, closeDate: new Date('2026-06-25') };
            const oppC = { amount: 150000n, probability: 40, closeDate: new Date('2026-07-05') };
            prisma.opportunity.findMany.mockResolvedValue([oppA, oppB, oppC]);
            const result = await service.getForecast('org-1', {}, client_1.Role.ADMIN, 'user-1');
            expect(result.summary.totalValue).toBe(4500);
            expect(result.summary.expectedValue).toBe(2700);
            expect(result.monthly).toHaveLength(2);
            expect(result.monthly[0]).toEqual({
                month: '2026-06',
                count: 2,
                totalValue: 3000,
                expectedValue: 2100,
            });
            expect(result.monthly[1]).toEqual({
                month: '2026-07',
                count: 1,
                totalValue: 1500,
                expectedValue: 600,
            });
        });
    });
});
//# sourceMappingURL=opportunities.service.spec.js.map