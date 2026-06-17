import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
export declare class EmailTemplatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(orgId: string, userId: string): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        createdById: string;
        isShared: boolean;
        bodyHtml: string;
    })[]>;
    create(dto: CreateEmailTemplateDto, userId: string, orgId: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        createdById: string;
        isShared: boolean;
        bodyHtml: string;
    }>;
    update(id: string, dto: UpdateEmailTemplateDto, userId: string, orgId: string, role: Role): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        createdById: string;
        isShared: boolean;
        bodyHtml: string;
    }>;
    remove(id: string, userId: string, orgId: string, role: Role): Promise<{
        success: boolean;
    }>;
}
