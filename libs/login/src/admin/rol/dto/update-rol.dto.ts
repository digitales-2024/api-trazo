import { PartialType } from '@nestjs/mapped-types';
import { CreateRolDto } from './create-rol.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRolDto extends PartialType(CreateRolDto) {
  @ApiPropertyOptional({
    description: 'Name of the rol',
    example: 'admin'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the rol',
    example: 'Administrator'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Permissions of the rol',
    example: ['1', '2']
  })
  rolPermissions?: string[];
}
