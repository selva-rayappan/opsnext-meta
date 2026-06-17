import { Tag } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
export declare class TagsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string): Promise<Tag[]>;
    create(dto: CreateTagDto, orgId: string, actorId: string): Promise<Tag>;
    update(id: string, dto: UpdateTagDto, orgId: string, actorId: string): Promise<Tag>;
    delete(id: string, orgId: string, actorId: string): Promise<void>;
}
