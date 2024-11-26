import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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
  @IsOptional()
  designProjectId?: string;

  @ApiProperty({
    name: 'directCost',
    description: 'Direct cost of the project',
  })
  @IsNumber()
  @IsNotEmpty()
  directCost: number;

  @ApiProperty({
    name: 'overhead',
    description: 'Overhead of the project',
  })
  @IsNumber()
  @IsNotEmpty()
  overhead: number;

  @ApiProperty({
    name: 'utility',
    description: 'Utility of the project',
  })
  @IsNumber()
  @IsNotEmpty()
  utility: number;

  @ApiProperty({
    name: 'igv',
    description: 'IGV of the project',
  })
  @IsNumber()
  @IsNotEmpty()
  igv: number;

  @ApiProperty({
    name: 'percentageOverhead',
    description: 'Percentage of overhead',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  percentageOverhead: number;

  @ApiProperty({
    name: 'percentageUtility',
    description: 'Percentage of utility',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  percentageUtility: number;

  @ApiProperty({
    name: 'totalCost',
    description: 'Total cost of the project',
  })
  @IsNumber()
  @IsNotEmpty()
  totalCost: number;
}
