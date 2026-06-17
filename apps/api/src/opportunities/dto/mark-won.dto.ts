import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkWonDto {
  @ApiPropertyOptional({ description: 'The date when the opportunity was won' })
  @IsDateString()
  @IsOptional()
  wonAt?: string;
}
