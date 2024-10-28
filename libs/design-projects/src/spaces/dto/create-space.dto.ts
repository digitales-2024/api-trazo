import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty({
    name: 'name',
    description: 'Space name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    name: 'name',
    description: 'Description',
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  description: string;
}
