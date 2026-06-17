import { UserPayload } from '@opsnext/shared';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
export declare class EmailTemplatesController {
    private readonly service;
    constructor(service: EmailTemplatesService);
    findAll(user: UserPayload): Promise<({
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
    create(dto: CreateEmailTemplateDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdateEmailTemplateDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<{
        success: boolean;
    }>;
}
