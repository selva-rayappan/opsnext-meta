import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
