import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    description: 'Updated role for the user',
  })
  @IsEnum(Role)
  role!: Role;
}
