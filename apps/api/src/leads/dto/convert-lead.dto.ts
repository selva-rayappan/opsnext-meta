import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    default: false,
    description: 'When true, also creates an Opportunity linked to the converted contact',
  })
  @IsOptional()
  @IsBoolean()
  createOpportunity: boolean = false;

  @ApiPropertyOptional({
    example: 'Acme Corp — Enterprise Deal',
    description: 'Opportunity name (required when createOpportunity is true)',
  })
  @ValidateIf((o: ConvertLeadDto) => o.createOpportunity === true)
  @IsString()
  opportunityTitle?: string;

  @ApiPropertyOptional({
    description: 'Pipeline UUID to assign the opportunity to',
  })
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Expected deal value',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;
}
