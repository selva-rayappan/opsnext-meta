import { PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';

/**
 * All fields from CreateAccountDto are optional for PATCH updates.
 */
export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
