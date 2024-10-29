import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLevelDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the level',
    example: 'Primer nivel',
    required: false,
  })
  @IsString({ message: 'name should be a string' })
  @Transform(({ value }) => value?.trim?.())
  name: string;
}
