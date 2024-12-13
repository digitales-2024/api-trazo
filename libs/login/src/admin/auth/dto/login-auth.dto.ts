import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({
    name: 'email',
    description: 'User email',
    example: 'admin@admin.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'User password',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
