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
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: 'Name of the resource',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    description: 'Unit of measurement',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  unit: string;

  @ApiProperty({
    description: 'Cost per unit',
  })
  @IsNumber()
  @IsPositive()
  unitCost: number;
}
