import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@opsnext/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'jane.doe@example.com', description: 'User email address' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    enum: Role,
    default: Role.SALES_REP,
    description: 'User role within the organization',
  })
  @IsEnum(Role)
  role: Role = Role.SALES_REP;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Password: min 8 chars, must include uppercase, lowercase, digit, special char',
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
  password: string;
}
