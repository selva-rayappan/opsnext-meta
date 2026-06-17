"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const reports_service_1 = require("./reports.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
describe('ReportsService', () => {
    let service;
    let prisma;
    const mockOpportunity = {
        id: 'opp-1',
        organizationId: 'org-1',
        name: 'Deal A',
        amount: BigInt(500000),
        probability: 50,
        stageId: 'stage-1',
        status: client_1.OpportunityStatus.OPEN,
        closeDate: new Date('2026-06-15'),
        stage: { id: 'stage-1', name: 'Proposal' },
    };
    const mockActivity = {
        id: 'act-1',
        organizationId: 'org-1',
        userId: 'rep-1',
        type: client_1.ActivityType.CALL,
        user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    };
    const mockPrisma = {
        opportunity: {
            findMany: jest.fn(),
        },
        activity: {
            findMany: jest.fn(),
        },
        lead: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                reports_service_1.ReportsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(reports_service_1.ReportsService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('getPipelineSummary', () => {
        it('should aggregate opportunity stages totals and convert BigInt values', async () => {
            prisma.opportunity.findMany.mockResolvedValue([mockOpportunity]);
            const result = await service.getPipelineSummary('org-1', client_1.Role.ADMIN, 'user-1');
            expect(result).toEqual([
                {
                    name: 'Proposal',
                    count: 1,
                    totalValue: 5000,
                    expectedValue: 2500,
                },
            ]);
        });
    });
    describe('getActivityByRep', () => {
        it('should calculate activity counts by rep', async () => {
            prisma.activity.findMany.mockResolvedValue([mockActivity]);
            const result = await service.getActivityByRep('org-1', client_1.Role.ADMIN, 'user-1');
            expect(result).toEqual([
                {
                    name: 'John Doe',
                    email: 'john@example.com',
                    CALL: 1,
                    MEETING: 0,
                    EMAIL_LOG: 0,
                    NOTE: 0,
                    total: 1,
                },
            ]);
        });
    });
    describe('exportCsv', () => {
        it('should return a structured CSV string', async () => {
            prisma.opportunity.findMany.mockResolvedValue([mockOpportunity]);
            const csv = await service.exportCsv('pipeline-summary', 'org-1', client_1.Role.ADMIN, 'user-1');
            expect(csv).toContain('Stage Name,Opportunity Count,Total Value (USD),Expected Value (USD)');
            expect(csv).toContain('"Proposal",1,5000,2500');
        });
    });
});
//# sourceMappingURL=reports.service.spec.js.map