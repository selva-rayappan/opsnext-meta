import { CustomField, CustomFieldValue } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto, CustomFieldEntityType } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
export declare class CustomFieldsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(orgId: string, entityType?: CustomFieldEntityType): Promise<CustomField[]>;
    create(dto: CreateCustomFieldDto, orgId: string): Promise<CustomField>;
    update(id: string, dto: UpdateCustomFieldDto, orgId: string): Promise<CustomField>;
    delete(id: string, orgId: string): Promise<void>;
    getValue(fieldId: string, entityId: string): Promise<CustomFieldValue | null>;
    setValue(fieldId: string, entityType: CustomFieldEntityType, entityId: string, value: unknown, orgId: string): Promise<CustomFieldValue>;
    getEntityValues(entityType: CustomFieldEntityType, entityId: string, orgId: string): Promise<Array<{
        field: CustomField;
        value: CustomFieldValue | null;
    }>>;
}
