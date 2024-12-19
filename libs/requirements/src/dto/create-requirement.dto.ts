import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

// DTO para los detalles del requerimiento
export class RequirementDetailDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Cantidad',
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    name: 'dateDetail',
    description: 'Fecha del detalle requerimiento',
  })
  @IsDateString()
  @IsNotEmpty()
  dateDetail: string;

  @ApiProperty({
    name: 'description',
    description: 'Descripción del requerimiento',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    name: 'resourceId',
    description: 'ID del recurso asociado',
  })
  @IsString()
  @IsNotEmpty()
  resourceId: string;
}

// DTO principal para la creación del requerimiento
export class CreateRequirementDto {
  @ApiProperty({
    name: 'date',
    description: 'Fecha del requerimiento',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    name: 'residentId',
    description: 'ID del residente asociado',
  })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({
    name: 'executionProyectId',
    description: 'ID del proyecto de ejecución',
  })
  @IsString()
  @IsNotEmpty()
  executionProyectId: string;

  @ApiProperty({
    name: 'requirementsDetail',
    description: 'Detalles del requerimiento',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDetailDto)
  requirementsDetail: RequirementDetailDto[];
}
