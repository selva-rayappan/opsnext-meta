import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'VIP', description: 'Tag display name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: '#6B7280',
    default: '#6B7280',
    description: 'Hex color code for the tag badge',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
