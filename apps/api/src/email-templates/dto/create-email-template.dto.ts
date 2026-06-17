import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional({ description: 'Visible to all org members when true (default: true)' })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}
