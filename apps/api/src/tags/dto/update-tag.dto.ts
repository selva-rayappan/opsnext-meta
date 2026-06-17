import { PartialType } from '@nestjs/swagger';
import { CreateTagDto } from './create-tag.dto';

/**
 * All fields from CreateTagDto are optional for PATCH updates.
 */
export class UpdateTagDto extends PartialType(CreateTagDto) {}
