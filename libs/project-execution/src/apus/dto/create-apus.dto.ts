import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateApusDto {
  @ApiProperty({
    description: 'Performance of this APU. For reference only',
    example: 25.0,
  })
  @IsNumber()
  @IsPositive()
  performance: number;

  @ApiProperty({
    description: "How many hours the worker's day lasts",
    example: 8,
  })
  @IsNumber()
  @IsPositive()
  workHours: number;

  @ApiProperty({
    description: 'List of resources to create the APU with',
    type: 'Array<CreateApuResourceDto>',
    example: [
      {
        resourceId: '0000-3333-ffff',
        quantity: 1.64,
        group: 0.5,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateApuResourceDto)
  resources: Array<CreateApuResourceDto>;
}

// DTO to validate resources used to create an APU
class CreateApuResourceDto {
  @ApiProperty({
    description: 'ID of the resource to use',
    example: '0000-ffff-0000',
  })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: 'How much of the resource to add. Can be a float number',
    example: 0.64,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'cuadrilla. May be empty',
    required: false,
    example: 0.1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  group?: number;
}
