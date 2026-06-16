import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto: all fields from CreateUserDto except password are optional.
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}

/**
 * Separate DTO for password changes — requires the current password for verification.
 */
export class UpdatePasswordDto {
  @ApiProperty({ description: 'Current (existing) password for verification' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password: min 8 chars, must include uppercase, lowercase, digit, special char',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  })
  newPassword: string;
}
