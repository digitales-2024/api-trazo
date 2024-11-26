import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the project this budget belongs to',
    example: 'Nombre del proyecto',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({
    name: 'ubication',
    description: 'Ubication of the project',
    example: 'Ubicacion del proyecto',
  })
  @IsString()
  @IsNotEmpty()
  ubication: string;

  @ApiProperty({
    name: 'dateProject',
    description: 'Date of the project',
    example: '2021-12-31',
  })
  @IsDateString()
  @IsNotEmpty()
  dateProject: string;

  @ApiProperty({
    name: 'clientId',
    description: 'Id of the person that requests this budget',
    example: 'Id del cliente',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({
    name: 'designProjectId',
    description: 'Id of the design project this budget belongs to',
    example: 'Id del proyecto de diseño',
    required: false,
  })
  @IsString()
  @IsUUID()
  @Optional()
  designProjectId?: string;

  @ApiProperty({
    name: 'directCost',
    description: 'Direct cost of the project',
    example: 'Costo directo del proyecto',
  })
  @IsNumber()
  @IsNotEmpty()
  directCost: number;

  @ApiProperty({
    name: 'overhead',
    description: 'Overhead of the project',
    example: 'Gastos generales del proyecto',
  })
  @IsNumber()
  @IsNotEmpty()
  overhead: number;

  @ApiProperty({
    name: 'utility',
    description: 'Utility of the project',
    example: 'Utilidad del proyecto',
  })
  @IsNumber()
  @IsNotEmpty()
  utility: number;

  @ApiProperty({
    name: 'igv',
    description: 'IGV of the project',
    example: 'IGV del proyecto',
  })
  @IsNumber()
  @IsNotEmpty()
  igv: number;

  @ApiProperty({
    name: 'percentageDirectCost',
    description: 'Percentage of direct cost',
    example: 'Porcentaje de costo directo',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  percentageOverhead: number;

  @ApiProperty({
    name: 'percentageOverhead',
    description: 'Percentage of overhead',
    example: 'Porcentaje de gastos generales',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  percentageUtility: number;

  @ApiProperty({
    name: 'percentageUtility',
    description: 'Percentage of utility',
    example: 'Porcentaje de utilidad',
  })
  @IsNumber()
  @IsNotEmpty()
  totalCost: number;
}
