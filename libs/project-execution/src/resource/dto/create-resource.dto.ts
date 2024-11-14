import { ResourceType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.TOOLS,
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: 'Name of the resource',
    example: 'Martillo',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'und',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  unit: string;

  @ApiProperty({
    description: 'Cost per unit',
    example: 15.5,
  })
  @IsNumber()
  @IsPositive()
  unitCost: number;
}
