import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaceDto } from './create-space.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) {
  @ApiProperty({
    name: 'name',
    description: 'Space name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string;

  @ApiProperty({
    name: 'description',
    description: 'Description',
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description?: string;
}
