import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLevelDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the level',
    example: 'Primer nivel',
    required: false,
  })
  @IsNotEmpty()
  @IsString({ message: 'name should be a string' })
  @Transform(({ value }) => value?.trim?.()?.toLowerCase?.())
  name: string;
}
