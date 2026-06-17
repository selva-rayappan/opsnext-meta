"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tasks_service_1 = require("./tasks.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
describe('TasksService', () => {
    let service;
    let prisma;
    const mockTask = {
        id: 'task-1',
        organizationId: 'org-1',
        title: 'Review proposal',
        description: 'Review the final contract pricing',
        status: client_1.TaskStatus.OPEN,
        priority: client_1.TaskPriority.HIGH,
        assigneeId: 'user-2',
        createdById: 'user-1',
        dueAt: new Date(),
        completedAt: null,
    };
    const mockPrisma = {
        task: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
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
                tasks_service_1.TasksService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAudit },
            ],
        }).compile();
        service = module.get(tasks_service_1.TasksService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('should query and return tasks', async () => {
            prisma.task.count.mockResolvedValue(1);
            prisma.task.findMany.mockResolvedValue([mockTask]);
            const result = await service.findAll('org-1', { page: 1, limit: 10 }, client_1.Role.ADMIN, 'user-1');
            expect(result.data).toEqual([mockTask]);
            expect(prisma.task.findMany).toHaveBeenCalled();
        });
        it('should restrict queries for SALES_REP to owned or assigned tasks', async () => {
            prisma.task.count.mockResolvedValue(0);
            prisma.task.findMany.mockResolvedValue([]);
            await service.findAll('org-1', { page: 1, limit: 10 }, client_1.Role.SALES_REP, 'user-1');
            expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { assigneeId: 'user-1' },
                        { createdById: 'user-1' },
                    ],
                }),
            }));
        });
    });
    describe('create', () => {
        it('should fail if assignee does not exist', async () => {
            prisma.user.findFirst.mockResolvedValue(null);
            await expect(service.create({ title: 'Task', assigneeId: 'user-not-found' }, 'creator-1', 'org-1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should create task successfully', async () => {
            prisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
            prisma.task.create.mockResolvedValue(mockTask);
            const result = await service.create({ title: 'Review proposal', assigneeId: 'user-2' }, 'user-1', 'org-1');
            expect(result).toEqual(mockTask);
            expect(prisma.task.create).toHaveBeenCalled();
        });
    });
    describe('update', () => {
        it('should automatically stamp completedAt when transitioning status to COMPLETED', async () => {
            prisma.task.findFirst.mockResolvedValue(mockTask);
            prisma.task.update.mockImplementation((params) => Promise.resolve({ ...mockTask, ...params.data }));
            const result = await service.update('task-1', { status: client_1.TaskStatus.COMPLETED }, 'user-1', 'org-1', client_1.Role.ADMIN);
            expect(result.status).toBe(client_1.TaskStatus.COMPLETED);
            expect(result.completedAt).toBeInstanceOf(Date);
        });
    });
});
//# sourceMappingURL=tasks.service.spec.js.map