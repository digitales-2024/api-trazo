import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateExecutionProjectDto } from './create-execution-project.dto';

export class UpdateExecutionProjectDto extends PartialType(
  CreateExecutionProjectDto,
) {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Project location', required: false })
  @IsString()
  @IsOptional()
  ubicationProject?: string;

  @ApiProperty({ description: 'Province', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: 'Department', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Client ID associated with the project',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Budget ID', required: false })
  @IsUUID()
  @IsOptional()
  budgetId?: string;

  @ApiProperty({ description: 'Resident ID', required: false })
  @IsUUID()
  @IsOptional()
  residentId?: string;

  @ApiProperty({
    description: 'Fecha para el inicio del proyecto',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  startProjectDate?: string;
}
