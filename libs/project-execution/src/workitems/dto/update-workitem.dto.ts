import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
