import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class CreateExecutionProjectDto {
  @ApiProperty({
    description: 'Name of the project',
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
  @Transform(({ value }) => value.trim())
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
    description: 'Budget ID associated with the project',
  })
  @IsUUID()
  @IsNotEmpty()
  budgetId: string;

  @ApiProperty({
    description: 'Resident ID assigned to the project',
  })
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({
    description: 'Fecha para el inicio del proyecto',
    example: '2024-01-15',
  })
  @IsDateString()
  startProjectDate: string;

  @ApiProperty({
    description: 'Plazo de Ejecución del proyecto',
  })
  @IsNumberString()
  @IsNotEmpty()
  executionTime: string;
}
