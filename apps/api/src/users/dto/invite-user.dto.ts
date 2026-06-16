import { IsEmail, IsEnum, MaxLength, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@opsnext/shared';

export class InviteUserDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'Email address to invite' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    enum: Role,
    default: Role.SALES_REP,
    description: 'Role to assign to the invited user. SUPER_ADMIN cannot be invited.',
  })
  @IsEnum(Role)
  @NotEquals(Role.SUPER_ADMIN, { message: 'SUPER_ADMIN cannot be invited via this endpoint' })
  role: Role = Role.SALES_REP;
}
