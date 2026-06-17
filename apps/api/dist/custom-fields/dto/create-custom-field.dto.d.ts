export declare const CUSTOM_FIELD_ENTITY_TYPES: readonly ["Contact", "Account", "Lead", "Opportunity"];
export type CustomFieldEntityType = (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];
export declare const CUSTOM_FIELD_TYPES: readonly ["text", "number", "date", "boolean", "select", "multiselect"];
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];
export declare class CreateCustomFieldDto {
    entityType: CustomFieldEntityType;
    name: string;
    fieldType: CustomFieldType;
    isRequired?: boolean;
    options?: string[];
    order?: number;
}
