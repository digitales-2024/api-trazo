import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const)
) {
  @ApiProperty({
    required: false,
    description: 'User name'
  })
  name?: string;

  @ApiProperty({
    required: false,
    description: 'User phone'
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'User rols'
  })
  roles?: string[];
}
