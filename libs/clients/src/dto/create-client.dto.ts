import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    name: 'name',
    description: 'Client name',
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
    name: 'rucDni',
    description: 'Client RUC or DNI',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  rucDni: string;

  @ApiProperty({
    name: 'address',
    description: 'Client address',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  address: string;

  @ApiProperty({
    name: 'province',
    description: 'Client province',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  province: string;

  @ApiProperty({
    name: 'department',
    description: 'Client department',
  })
  @IsString()
  @IsNotEmpty()
  department: string;
}
