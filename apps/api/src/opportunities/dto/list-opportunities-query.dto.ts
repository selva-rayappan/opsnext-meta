import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityStatus } from '@prisma/client';

export class ListOpportunitiesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @ApiPropertyOptional({ description: 'Search query across opportunity name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: OpportunityStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @ApiPropertyOptional({ description: 'Filter by pipeline UUID' })
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Filter by stage UUID' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ description: 'Filter by owner UUID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    enum: ['name', 'amount', 'closeDate', 'createdAt', 'probability'],
    default: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsIn(['name', 'amount', 'closeDate', 'createdAt', 'probability'])
  sortBy: 'name' | 'amount' | 'closeDate' | 'createdAt' | 'probability' = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
