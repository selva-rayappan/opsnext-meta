import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Supported entity types that can have custom fields. */
export const CUSTOM_FIELD_ENTITY_TYPES = [
  'Contact',
  'Account',
  'Lead',
  'Opportunity',
] as const;

export type CustomFieldEntityType = (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];

/** Supported field value types. */
export const CUSTOM_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multiselect',
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export class CreateCustomFieldDto {
  @ApiProperty({
    enum: CUSTOM_FIELD_ENTITY_TYPES,
    example: 'Contact',
    description: 'Entity type this field applies to',
  })
  @IsIn(CUSTOM_FIELD_ENTITY_TYPES)
  entityType: CustomFieldEntityType;

  @ApiProperty({ example: 'LinkedIn URL', description: 'Field display name (unique per entity type per org)' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: CUSTOM_FIELD_TYPES,
    example: 'text',
    description: 'Data type for the field value',
  })
  @IsIn(CUSTOM_FIELD_TYPES)
  fieldType: CustomFieldType;

  @ApiPropertyOptional({ default: false, description: 'Whether the field is mandatory' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Options for select / multiselect fields — array of string option values',
    type: 'array',
    items: { type: 'string' },
  })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({
    default: 0,
    description: 'Display order within the entity form',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
