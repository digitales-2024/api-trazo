import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  rolPermissions: string[];
}
