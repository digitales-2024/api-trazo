import { ApiProperty } from '@nestjs/swagger';
import { CreateApusDto } from '@project-execution/project-execution/apus/dto/create-apus.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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
    required: false,
    example: 'm2',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @ApiProperty({
    description: 'List of resources to create the APU with',
    type: 'CreateWorkItemApu',
    required: false,
    example: {
      performance: 25,
      workHours: 8,
      resources: [],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateApusDto)
  apu?: CreateApusDto;
}
