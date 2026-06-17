import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StageType } from '@prisma/client';

export class CreateStageDto {
  @ApiProperty({ description: 'The name of the stage' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The probability associated with the stage (0-100)', default: 50 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @ApiPropertyOptional({ description: 'The type of the stage (OPEN, WON, LOST)', enum: StageType, default: StageType.OPEN })
  @IsEnum(StageType)
  @IsOptional()
  stageType?: StageType;
}
