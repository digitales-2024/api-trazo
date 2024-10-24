import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import {
  IsNotEmpty,
  IsNumberString,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiProperty({
    name: 'name',
    description: 'Client name',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string;

  @ApiProperty({
    name: 'rucDni',
    description: 'Client RUC or DNI',
    required: false,
  })
  @IsNumberString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  rucDni?: string;

  @ApiProperty({
    name: 'address',
    description: 'Client address',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  address?: string;

  @ApiProperty({
    name: 'phone',
    description: 'Client phone',
    required: false,
  })
  @IsPhoneNumber('PE')
  @Transform(({ value }) => value.trim())
  phone?: string;

  @ApiProperty({
    name: 'province',
    description: 'Client province',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  province?: string;

  @ApiProperty({
    name: 'department',
    description: 'Client department',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  department?: string;
}
