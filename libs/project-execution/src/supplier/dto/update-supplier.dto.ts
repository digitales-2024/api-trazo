import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { CreateSupplierDto } from './create-supplier.dto';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiProperty({
    name: 'name',
    description: 'Supplier name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string;

  @ApiProperty({
    name: 'phone',
    description: 'Supplier phone',
    required: false,
  })
  @IsPhoneNumber('PE')
  @Transform(({ value }) => value.trim())
  phone?: string;

  @ApiProperty({
    name: 'ruc',
    description: 'Supplier RUC ',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  ruc?: string;

  @ApiProperty({
    name: 'address',
    description: 'Supplier address',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  address?: string;

  @ApiProperty({
    name: 'email',
    description: 'Supplier email',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  email?: string;

  @ApiProperty({
    name: 'province',
    description: 'Supplier province',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  province?: string;

  @ApiProperty({
    name: 'department',
    description: 'Supplier department',
  })
  @IsString()
  @IsNotEmpty()
  department?: string;
}
