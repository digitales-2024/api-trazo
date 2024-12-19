import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRequirementDto {
  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  residentId: string;
}

export class UpdateRequirementDetailDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Cantidad',
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    name: 'dateDetail',
    description: 'Fecha del detalle requerimiento',
  })
  @IsString()
  dateDetail?: string;

  @ApiProperty({
    name: 'description',
    description: 'Descripción del requerimiento',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    name: 'resourceId',
    description: 'ID del recurso asociado',
  })
  @IsString()
  @IsNotEmpty()
  resourceId?: string;
}
