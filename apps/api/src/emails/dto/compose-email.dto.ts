import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ComposeEmailDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  toAddresses: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  ccAddresses?: string[];

  @ApiProperty()
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  opportunityId?: string;
}
