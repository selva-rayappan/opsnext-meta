import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, ActivityType } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: any;

  const mockActivity = {
    id: 'act-1',
    organizationId: 'org-1',
    userId: 'user-1',
    type: ActivityType.CALL,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query and filter activities', async () => {
      prisma.activity.count.mockResolvedValue(1);
      prisma.activity.findMany.mockResolvedValue([mockActivity]);

      const result = await service.findAll('org-1', { page: 1, limit: 10 }, Role.ADMIN, 'user-1');
      expect(result.data).toEqual([mockActivity]);
      expect(prisma.activity.findMany).toHaveBeenCalled();
    });

    it('should restrict query to own activities for SALES_REP', async () => {
      prisma.activity.count.mockResolvedValue(0);
      prisma.activity.findMany.mockResolvedValue([]);

      await service.findAll('org-1', { page: 1, limit: 10 }, Role.SALES_REP, 'user-1');
      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should fail if no entity is linked', async () => {
      await expect(
        service.create({ type: ActivityType.CALL, subject: 'Call' }, 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create new activity successfully', async () => {
      prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' });
      prisma.activity.create.mockResolvedValue(mockActivity);

      const result = await service.create(
        { type: ActivityType.CALL, subject: 'Follow-up Call', contactId: 'contact-1' },
        'user-1',
        'org-1',
      );

      expect(result).toEqual(mockActivity);
      expect(prisma.activity.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException for SALES_REP', async () => {
      prisma.activity.findFirst.mockResolvedValue(mockActivity);

      await expect(
        service.delete('act-1', 'user-1', 'org-1', Role.SALES_REP),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete activity successfully for ADMIN', async () => {
      prisma.activity.findFirst.mockResolvedValue(mockActivity);
      prisma.activity.delete.mockResolvedValue(mockActivity);

      const result = await service.delete('act-1', 'user-1', 'org-1', Role.ADMIN);
      expect(result.success).toBe(true);
      expect(prisma.activity.delete).toHaveBeenCalled();
    });
  });
});
