import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceDto } from './create-resource.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ResourceType } from '@prisma/client';

export class UpdateResourceDto extends PartialType(CreateResourceDto) {
  @ApiProperty({
    description: 'Type of resource',
    enum: ResourceType,
    example: ResourceType.TOOLS,
    required: false,
  })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  type?: ResourceType;

  @ApiProperty({
    description: 'Name of the resource',
    example: 'Martillo',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'und',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  unit?: string;

  @ApiProperty({
    description: 'Cost per unit',
    example: 15.5,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  unitCost?: number;
}
