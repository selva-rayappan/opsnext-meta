import {
  IsString,
  IsInt,
  IsEmail,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertEmailIntegrationDto {
  @ApiProperty()
  @IsString()
  smtpHost: string;

  @ApiProperty({ minimum: 1, maximum: 65535 })
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort: number;

  @ApiProperty()
  @IsString()
  smtpUser: string;

  @ApiPropertyOptional({ description: 'Plaintext SMTP password — encrypted before storage' })
  @IsString()
  @IsOptional()
  smtpPass?: string;

  @ApiProperty()
  @IsString()
  smtpFromName: string;

  @ApiProperty()
  @IsEmail()
  smtpFromEmail: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  smtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  imapEnabled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imapHost?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  imapPort?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imapUser?: string;

  @ApiPropertyOptional({ description: 'Plaintext IMAP password — encrypted before storage' })
  @IsString()
  @IsOptional()
  imapPass?: string;
}
