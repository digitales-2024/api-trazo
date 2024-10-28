import { PartialType } from '@nestjs/mapped-types';
import { CreateQuotationDto } from './create-quotation.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { QuotationStatusType } from '@prisma/client';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @ApiProperty({
    name: 'name',
    description: 'Name of the project this quotation belongs to',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({
    name: 'code',
    description: 'Code of the quotation',
    example: 'SGC-P-04-F3',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  code: string;

  @ApiProperty({
    name: 'status',
    description:
      'Status to set the quotation to. Can only be PENDING, APPROVED, REJECTED',
    example: 'PENDING',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'], {
    message: "newStatus must be either 'PENDING', 'APPROVED' or 'REJECTED'",
  })
  status: QuotationStatusType;

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
  discount: number;

  @ApiProperty({
    name: 'deliveryTime',
    description: 'Time to completion, in months',
    example: 4,
    required: false,
  })
  @IsInt({ message: 'deliveryTime must be an integer' })
  deliveryTime: number;

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
  exchangeRate: number;

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
  landArea: number;

  @ApiProperty({
    name: 'paymentSchedule',
    description:
      'Schedule that dictates how many and when payments are made. Stored as a JSON.',
    example: '{}',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  paymentSchedule: string;

  // Proyecto integral: Planos y detalles de cada área
  @ApiProperty({
    name: 'integratedProjectDetails',
    description:
      'JSON object that defines the integrated project and its fields.',
    example: '{}',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  integratedProjectDetails: string;

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
  architecturalCost: number;

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
  structuralCost: number;

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
  electricCost: number;

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
  sanitaryCost: number;

  @ApiProperty({
    name: 'metrado',
    description: 'Total area of the project',
    example: 750,
    required: false,
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    { message: 'metrado must be a number' },
  )
  metrado: number;
}
