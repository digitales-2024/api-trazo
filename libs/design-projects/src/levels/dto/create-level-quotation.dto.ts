import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateLevelFromQuotationDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the level',
    example: 'Primer nivel',
  })
  @IsString({ message: 'name should be a string' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim?.())
  name: string;

  // ambientes
  @ApiProperty({
    name: 'spaces',
    description:
      'Array of Spaces to create and link with this level. If empty, wont create any Space-Level',
    required: false,
    example: [{ amount: 2, area: 15.0, spaceId: 'aaaa-0000-ffff' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLevelSpaceDto)
  spaces: CreateLevelSpaceDto[];
}

export class CreateLevelSpaceDto {
  @ApiProperty({
    name: 'amount',
    description: 'Number of times this space repeats',
    example: 2,
  })
  @IsInt({ message: 'amount must be an integer' })
  amount: number;

  @ApiProperty({
    name: 'area',
    description: 'area of the space',
    example: 15.0,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'area must be a floating point number' },
  )
  area: number;

  // Relacion con Spaces
  @ApiProperty({
    name: 'spaceId',
    description: 'ID of the linked space',
  })
  @IsString()
  @IsNotEmpty()
  spaceId: string;
}
