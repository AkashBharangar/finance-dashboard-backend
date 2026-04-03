import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@finance.local',
    description: 'Email used to authenticate the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Admin@123',
    description: 'Password for the user account',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
