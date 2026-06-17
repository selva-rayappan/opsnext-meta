import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForecastQueryDto {
  @ApiPropertyOptional({ description: 'Filter forecast by pipeline ID' })
  @IsUUID('4')
  @IsOptional()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Start close date for forecast range' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End close date for forecast range' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
