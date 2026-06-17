import { PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';

/**
 * All fields from CreateContactDto are optional for PATCH updates.
 */
export class UpdateContactDto extends PartialType(CreateContactDto) {}
