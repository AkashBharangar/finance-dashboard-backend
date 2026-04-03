import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: false,
    description: 'Whether the user account should remain active',
  })
  @IsBoolean()
  isActive!: boolean;
}
