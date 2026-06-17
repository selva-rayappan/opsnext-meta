import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomFieldDto } from './create-custom-field.dto';

/**
 * Updates are partial; entityType is excluded because changing the entity
 * type of an existing field would orphan all stored values.
 */
export class UpdateCustomFieldDto extends PartialType(
  OmitType(CreateCustomFieldDto, ['entityType'] as const),
) {}
