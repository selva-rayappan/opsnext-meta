import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePipelineDto {
  @ApiProperty({ description: 'The name of the pipeline' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Is this the default pipeline for the organization', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
