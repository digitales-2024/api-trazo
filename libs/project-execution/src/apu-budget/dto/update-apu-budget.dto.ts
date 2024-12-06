import { PartialType } from '@nestjs/swagger';
import { CreateApuBudgetDto } from './create-apu-budget.dto';
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

export class UpdateApuBudgetDto extends PartialType(CreateApuBudgetDto) {
  @ApiProperty({
    description: 'Performance of this APU.',
    example: 25.0,
  })
  @IsNumber()
  @IsPositive()
  performance?: number;

  @ApiProperty({
    description: "Work hours of the worker's day",
  })
  @IsNumber()
  @IsPositive()
  workHours?: number;

  @ApiProperty({
    description: 'List of resources to create the APU with',
    type: 'Array<CreateApuResourceDto>',
    example: [
      {
        resourceId: '',
        quantity: 0,
        group: 0,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateApuResourceBudgetDto)
  resources?: Array<CreateApuResourceBudgetDto>;
}

// DTO to validate resources used to create an APU
export class CreateApuResourceBudgetDto {
  @ApiProperty({
    description: 'ID of the resource to use',
  })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: 'Quantity of the resource to add. Can be a float number',
    example: 0.64,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Group could be empty',
    required: false,
    example: 0.1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  group?: number;
}
