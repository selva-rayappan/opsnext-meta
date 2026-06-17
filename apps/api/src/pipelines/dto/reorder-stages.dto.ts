import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderStagesDto {
  @ApiProperty({ description: 'Ordered list of stage IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  stageIds: string[];
}
