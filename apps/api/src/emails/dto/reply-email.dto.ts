import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReplyEmailDto {
  @ApiProperty()
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional({ type: [String], description: 'Override recipient list' })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  toAddresses?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  ccAddresses?: string[];
}
