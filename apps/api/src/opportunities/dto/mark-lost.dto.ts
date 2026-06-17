import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkLostDto {
  @ApiProperty({ description: 'The reason why the opportunity was lost' })
  @IsString()
  @IsNotEmpty()
  lostReason: string;
}
