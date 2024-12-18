import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    name: 'name',
    description: 'Supplier name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    name: 'phone',
    description: 'Client phone',
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
  ruc: string;

  @ApiProperty({
    name: 'address',
    description: 'Supplier address',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  address: string;

  @ApiProperty({
    name: 'email',
    description: 'Supplier email',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  email: string;
}
