import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID, IsString, IsArray } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Array containing meetings details',
    example: '[]',
  })
  @IsArray()
  meetings: string[];

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
