import { UserPayload } from '@opsnext/shared';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto, CustomFieldEntityType } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
declare class ListCustomFieldsQueryDto {
    entityType?: CustomFieldEntityType;
}
export declare class CustomFieldsController {
    private readonly customFields;
    constructor(customFields: CustomFieldsService);
    findAll(user: UserPayload, query: ListCustomFieldsQueryDto): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        entityType: string;
        fieldType: string;
        isRequired: boolean;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        order: number;
    }[]>;
    create(dto: CreateCustomFieldDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        entityType: string;
        fieldType: string;
        isRequired: boolean;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        order: number;
    }>;
    update(id: string, dto: UpdateCustomFieldDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        entityType: string;
        fieldType: string;
        isRequired: boolean;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        order: number;
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
}
export {};
