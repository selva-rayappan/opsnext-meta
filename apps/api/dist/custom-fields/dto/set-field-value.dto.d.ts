import { CustomFieldEntityType } from './create-custom-field.dto';
export declare class SetFieldValueDto {
    entityId: string;
    entityType: CustomFieldEntityType;
    value: unknown;
}
export declare class GetEntityValuesQueryDto {
    entityType: CustomFieldEntityType;
    entityId: string;
}
export declare class FilterByEntityTypeQueryDto {
    entityType?: CustomFieldEntityType;
}
