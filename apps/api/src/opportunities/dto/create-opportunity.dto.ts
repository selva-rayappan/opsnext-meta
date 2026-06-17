import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpportunityDto {
  @ApiProperty({ description: 'The name of the opportunity' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The monetary value of the opportunity in dollars' })
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'The currency code (e.g. USD)', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'The estimated close date of the deal' })
  @IsDateString()
  closeDate: string;

  @ApiProperty({ description: 'The ID of the pipeline' })
  @IsUUID('4')
  pipelineId: string;

  @ApiProperty({ description: 'The ID of the stage' })
  @IsUUID('4')
  stageId: string;

  @ApiPropertyOptional({ description: 'The ID of the linked contact' })
  @IsUUID('4')
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ description: 'The ID of the linked account' })
  @IsUUID('4')
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'The ID of the owner user' })
  @IsUUID('4')
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'The win probability (0-100)', default: 50 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;
}
