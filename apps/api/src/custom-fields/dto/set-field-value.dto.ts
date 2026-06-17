import { IsIn, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CUSTOM_FIELD_ENTITY_TYPES, CustomFieldEntityType } from './create-custom-field.dto';

export class SetFieldValueDto {
  @ApiProperty({ description: 'UUID of the entity (contact, account, etc.)' })
  @IsUUID()
  entityId: string;

  @ApiProperty({ enum: CUSTOM_FIELD_ENTITY_TYPES })
  @IsIn(CUSTOM_FIELD_ENTITY_TYPES)
  entityType: CustomFieldEntityType;

  @ApiProperty({
    description: 'The value to store. May be a string, number, boolean, date string, or array.',
  })
  // Accept any serialisable JSON value — validated at the service layer against fieldType
  value: unknown;
}

export class GetEntityValuesQueryDto {
  @ApiProperty({ enum: CUSTOM_FIELD_ENTITY_TYPES })
  @IsIn(CUSTOM_FIELD_ENTITY_TYPES)
  entityType: CustomFieldEntityType;

  @ApiProperty({ description: 'UUID of the entity' })
  @IsUUID()
  entityId: string;
}

export class FilterByEntityTypeQueryDto {
  @ApiProperty({ enum: CUSTOM_FIELD_ENTITY_TYPES, required: false })
  @IsIn(CUSTOM_FIELD_ENTITY_TYPES)
  @IsString()
  entityType?: CustomFieldEntityType;
}
