import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateQuotationDto } from './create-quotation.dto';
import { CreateLevelFromQuotationDto } from '@design-projects/design-projects/levels/dto/create-level-quotation.dto';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @ApiProperty({
    name: 'name',
    description: 'Name of the project this quotation belongs to',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name?: string;

  @ApiProperty({
    name: 'description',
    description: 'Description of the quotation',
    example: 'Se planifica diseño de una vivienda...',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  description?: string;

  @ApiProperty({
    name: 'discount',
    description: 'Discount to be applied to the square meter price.',
    example: 0.5,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'discount must be a floating point number' },
  )
  discount?: number;

  @ApiProperty({
    name: 'deliveryTime',
    description: 'Time to completion, in months',
    example: 4,
    required: false,
  })
  @IsInt({ message: 'deliveryTime must be an integer' })
  deliveryTime?: number;

  @ApiProperty({
    name: 'exchangeRate',
    description: 'Exchange rate from USD to PEN',
    example: 3.85,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'exchangeRate must be a floating point number' },
  )
  exchangeRate?: number;

  @ApiProperty({
    name: 'landArea',
    description: 'Area of the construction site in m2',
    example: 250,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'landArea must be a number point number' },
  )
  landArea?: number;

  @ApiProperty({
    name: 'paymentSchedule',
    description:
      'Array of JSON objects that dictate how many and when payments are made.',
    example: [],
  })
  @IsArray()
  @ArrayNotEmpty()
  paymentSchedule?: string[];

  // Proyecto integral: Planos y detalles de cada área
  @ApiProperty({
    name: 'integratedProjectDetails',
    description:
      'JSON object that defines the integrated project and its fields.',
    example: [],
    required: false,
  })
  @IsArray()
  @ArrayNotEmpty()
  integratedProjectDetails?: string[];

  @ApiProperty({
    name: 'architecturalCost',
    description: 'Price per square meter for the arquitecture blueprint',
    example: 3.0,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'architecturalCost must be a number' },
  )
  architecturalCost?: number;

  @ApiProperty({
    name: 'structuralCost',
    description: 'Price per square meter for the structure blueprint',
    example: 3.5,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'structuralCost must be a number' },
  )
  structuralCost?: number;

  @ApiProperty({
    name: 'electricCost',
    description: 'Price per square meter for the electric blueprint',
    example: 1.5,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'structuralCost must be a number' },
  )
  electricCost?: number;

  @ApiProperty({
    name: 'sanitaryCost',
    description: 'Price per square meter for the sanitary blueprint',
    example: 1.5,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'structuralCost must be a number' },
  )
  sanitaryCost?: number;

  @ApiProperty({
    name: 'metering',
    description: 'Total area of the project',
    example: 750,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'metering must be a number' },
  )
  metering?: number;

  // levels
  @ApiProperty({
    name: 'levels',
    description:
      'Array of Levels to create and link with this quotation. If empty, wont create any level',
    required: false,
    example: [
      {
        name: 'primer nivel',
        spaces: [{ amount: 2, area: 25.0, spaceId: 'aaaa-bbbb-ccc' }],
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateLevelFromQuotationDto)
  levels: CreateLevelFromQuotationDto[];

  // Relacion con Client
  @ApiProperty({
    name: 'clientId',
    description: 'Id of the person that requests this quotation',
    example: 'aaaaa-0000-ffff',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  // Relacion con Zoning
  @ApiProperty({
    name: 'zoningId',
    description: 'Id of the zoning this quotation belongs to',
    example: 'aaaaa-0000-ffff',
  })
  @IsString()
  @IsNotEmpty()
  zoningId: string;

  @ApiProperty({
    name: 'totalAmount',
    description: 'Total Amount of the quotation',
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'totalAmount must be a number' },
  )
  totalAmount: number;
}
