import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, IsUUID, IsDateString } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsEnum(ActivityType)
  @IsNotEmpty()
  type: ActivityType;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUUID()
  @IsOptional()
  opportunityId?: string;
}
