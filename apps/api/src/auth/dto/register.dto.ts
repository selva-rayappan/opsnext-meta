import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'alice@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @MinLength(12)
  password: string;
}
