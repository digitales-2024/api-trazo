import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID, IsString, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'Proyecto Residencial San Luis',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({
    description: 'Location of the project',
    example: 'Lima, Peru',
  })
  @IsString()
  @IsNotEmpty()
  ubicationProject: string;

  @ApiProperty({
    name: 'province',
    description: 'Client province',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  province: string;

  @ApiProperty({
    name: 'department',
    description: 'Client department',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    description: 'Client ID associated with the project',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Quotation ID associated with the project',
  })
  @IsUUID()
  @IsNotEmpty()
  quotationId: string;

  @ApiProperty({
    description: 'Designer ID assigned to the project',
  })
  @IsUUID()
  @IsNotEmpty()
  designerId: string;

  @ApiProperty({
    description: 'Fecha para el plano arquitectónico',
    example: '2024-01-15',
  })
  @IsDateString()
  startProjectDate: string;
}
