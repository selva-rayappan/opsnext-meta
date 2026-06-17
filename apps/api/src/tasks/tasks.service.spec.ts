import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;

  const mockTask = {
    id: 'task-1',
    organizationId: 'org-1',
    title: 'Review proposal',
    description: 'Review the final contract pricing',
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query and return tasks', async () => {
      prisma.task.count.mockResolvedValue(1);
      prisma.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAll('org-1', { page: 1, limit: 10 }, Role.ADMIN, 'user-1');
      expect(result.data).toEqual([mockTask]);
      expect(prisma.task.findMany).toHaveBeenCalled();
    });

    it('should restrict queries for SALES_REP to owned or assigned tasks', async () => {
      prisma.task.count.mockResolvedValue(0);
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll('org-1', { page: 1, limit: 10 }, Role.SALES_REP, 'user-1');
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { assigneeId: 'user-1' },
              { createdById: 'user-1' },
            ],
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should fail if assignee does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ title: 'Task', assigneeId: 'user-not-found' }, 'creator-1', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create task successfully', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
      prisma.task.create.mockResolvedValue(mockTask);

      const result = await service.create(
        { title: 'Review proposal', assigneeId: 'user-2' },
        'user-1',
        'org-1',
      );

      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should automatically stamp completedAt when transitioning status to COMPLETED', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.task.update.mockImplementation((params: any) => Promise.resolve({ ...mockTask, ...params.data }));

      const result = await service.update(
        'task-1',
        { status: TaskStatus.COMPLETED },
        'user-1',
        'org-1',
        Role.ADMIN,
      );

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });
});
