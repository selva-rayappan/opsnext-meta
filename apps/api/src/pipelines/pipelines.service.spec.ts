import { Test, TestingModule } from '@nestjs/testing';
import { PipelinesService } from './pipelines.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StageType } from '@prisma/client';

describe('PipelinesService', () => {
  let service: PipelinesService;
  let prisma: any;
  let audit: any;

  const mockPipeline = {
    id: 'pipeline-1',
    organizationId: 'org-1',
    name: 'Sales Pipeline',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    stages: [],
  };

  const mockStage = {
    id: 'stage-1',
    organizationId: 'org-1',
    pipelineId: 'pipeline-1',
    name: 'Prospecting',
    probability: 10,
    order: 0,
    stageType: StageType.OPEN,
    createdAt: new Date(),
  };

  const mockPrisma: any = {
    pipeline: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    stage: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    opportunity: {
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelinesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<PipelinesService>(PipelinesService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
    for (const key of Object.keys(mockPrisma)) {
      if (key === '$transaction') continue;
      const model = mockPrisma[key];
      for (const method of Object.keys(model)) {
        if (typeof model[method].mockReset === 'function') {
          model[method].mockReset();
        }
      }
    }
  });

  describe('findAll', () => {
    it('should list all pipelines', async () => {
      prisma.pipeline.findMany.mockResolvedValue([mockPipeline]);
      const result = await service.findAll('org-1');
      expect(result).toEqual([mockPipeline]);
      expect(prisma.pipeline.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return pipeline if exists', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);
      const result = await service.findById('pipeline-1', 'org-1');
      expect(result).toEqual(mockPipeline);
    });

    it('should throw NotFoundException if missing', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(null);
      await expect(service.findById('pipeline-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if duplicate name', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);
      await expect(
        service.create({ name: 'Sales Pipeline' }, 'user-1', 'org-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and set default if first pipeline', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(null);
      prisma.pipeline.count.mockResolvedValue(0);
      prisma.pipeline.create.mockResolvedValue({ ...mockPipeline, isDefault: true });

      const result = await service.create({ name: 'Sales Pipeline' }, 'user-1', 'org-1');
      expect(result.isDefault).toBe(true);
      expect(prisma.pipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDefault: true }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update and handle default status swapping', async () => {
      const nonDefaultPipeline = { ...mockPipeline, id: 'pipeline-2', isDefault: false };
      prisma.pipeline.findFirst
        .mockResolvedValueOnce(nonDefaultPipeline) // findById check
        .mockResolvedValueOnce(null); // name conflict check

      prisma.pipeline.update.mockResolvedValue({ ...nonDefaultPipeline, isDefault: true });

      const result = await service.update(
        'pipeline-2',
        { isDefault: true },
        'user-1',
        'org-1',
      );

      expect(result.isDefault).toBe(true);
      expect(prisma.pipeline.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException if pipeline is default', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);

      await expect(service.delete('pipeline-1', 'user-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if pipeline has opportunities', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({ ...mockPipeline, isDefault: false });
      prisma.opportunity.count.mockResolvedValue(5);

      await expect(service.delete('pipeline-1', 'user-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete stages and pipeline inside transaction', async () => {
      prisma.pipeline.findFirst.mockResolvedValue({ ...mockPipeline, isDefault: false });
      prisma.opportunity.count.mockResolvedValue(0);

      await service.delete('pipeline-1', 'user-1', 'org-1');

      expect(prisma.stage.deleteMany).toHaveBeenCalledWith({ where: { pipelineId: 'pipeline-1' } });
      expect(prisma.pipeline.delete).toHaveBeenCalledWith({ where: { id: 'pipeline-1' } });
    });
  });

  describe('createStage', () => {
    it('should add a stage and compute order automatically', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);
      prisma.stage.findFirst.mockResolvedValue(null);
      prisma.stage.count.mockResolvedValue(3);
      prisma.stage.create.mockResolvedValue({ ...mockStage, order: 3 });

      const result = await service.createStage(
        'pipeline-1',
        { name: 'Nurturing', probability: 25 },
        'user-1',
        'org-1',
      );

      expect(result.order).toBe(3);
      expect(prisma.stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 3 }),
        }),
      );
    });
  });

  describe('deleteStage', () => {
    it('should delete stage and reorder remaining sibling stages', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);
      const stageA = { ...mockStage, id: 'stage-A', order: 0 };
      const stageB = { ...mockStage, id: 'stage-B', order: 1 };
      const stageC = { ...mockStage, id: 'stage-C', order: 2 };

      prisma.stage.findFirst.mockResolvedValue(stageB);
      prisma.opportunity.count.mockResolvedValue(0);
      prisma.stage.findMany.mockResolvedValue([stageA, stageB, stageC]);

      await service.deleteStage('pipeline-1', 'stage-B', 'user-1', 'org-1');

      expect(prisma.stage.delete).toHaveBeenCalledWith({ where: { id: 'stage-B' } });
      expect(prisma.stage.update).toHaveBeenCalledWith({
        where: { id: 'stage-C' },
        data: { order: 1 }, // order 2 shifted to 1
      });
    });
  });

  describe('reorderStages', () => {
    it('should update orders for all sibling stages', async () => {
      prisma.pipeline.findFirst.mockResolvedValue(mockPipeline);
      prisma.stage.findMany
        .mockResolvedValueOnce([{ id: 'stage-1' }, { id: 'stage-2' }]) // verification
        .mockResolvedValueOnce([{ id: 'stage-2', order: 0 }, { id: 'stage-1', order: 1 }]); // return

      const result = await service.reorderStages(
        'pipeline-1',
        ['stage-2', 'stage-1'],
        'user-1',
        'org-1',
      );

      expect(result[0].id).toBe('stage-2');
      expect(prisma.stage.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: 'stage-2' },
          data: { order: 0 },
        }),
      );
    });
  });
});
