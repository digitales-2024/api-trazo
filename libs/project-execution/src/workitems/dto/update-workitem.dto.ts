import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWorkitemDto {
  @ApiProperty({
    description: 'Name of the workitem',
    example: 'Limpieza de terreno',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Unit of measure of the workitem',
    required: false,
    example: 'm2',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @ApiProperty({
    description: 'Cost of each unit of this workitem',
    required: false,
    example: 28.08,
  })
  @IsOptional()
  @IsNumber()
  unitCost?: number;
}
