import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStageDto {
  @ApiProperty({ description: 'The UUID of the destination stage' })
  @IsUUID('4')
  stageId: string;
}
