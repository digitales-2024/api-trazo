import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

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
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Quotation ID associated with the project',
    example: '987e4567-e89b-12d3-a456-426614174321',
  })
  @IsUUID()
  @IsNotEmpty()
  quotationId: string;

  @ApiProperty({
    description: 'Designer ID assigned to the project',
    example: '456e4567-e89b-12d3-a456-426614174999',
  })
  @IsUUID()
  @IsNotEmpty()
  designerId: string;
}

// update-project.dto.ts
export class UpdatePartialProjectDto {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({ description: 'Project location', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  ubicationProject?: string;

  @ApiProperty({ description: 'Province', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  province?: string;

  @ApiProperty({ description: 'Department', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
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
}
