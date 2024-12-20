import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
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

  @ApiProperty({ description: 'Client ID', required: false })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Quotation ID', required: false })
  @IsUUID()
  @IsOptional()
  quotationId?: string;

  @ApiProperty({ description: 'Designer ID', required: false })
  @IsUUID()
  @IsOptional()
  designerId?: string;
  @ApiProperty({
    description: 'Fecha para el plano arquitectónico',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  startProjectDate?: string;
}
