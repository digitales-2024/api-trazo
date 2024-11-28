import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateWorkItemApu {
  @ApiProperty({
    description: 'Performance of the related APU',
    example: 25.0,
  })
  @IsNumber()
  @IsPositive()
  performance: number;

  @ApiProperty({
    description: 'How many hours a day of work contains for this APU',
    example: 8,
  })
  @IsNumber()
  @IsPositive()
  workHours: number;
}

export class CreateWorkitemDto {
  @ApiProperty({
    description: 'Name of the workitem',
    example: 'Limpieza de terreno',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Unit of measure of the workitem',
    example: 'm2',
  })
  @IsString()
  @IsNotEmpty()
  unit: number;

  @ApiProperty({
    description: 'List of resources to create the APU with',
    type: 'CreateWorkItemApu',
    example: {
      performance: 25,
      workHours: 8,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWorkItemApu)
  apu: CreateWorkItemApu;
}
