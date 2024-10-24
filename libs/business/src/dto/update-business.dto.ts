import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateBusinessDto } from './create-business.dto';
import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @ApiProperty({
    name: 'name',
    description: 'Name of the business',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    name: 'ruc',
    description: 'RUC of the business',
    required: false,
  })
  @IsNumberString()
  @IsNotEmpty()
  @Length(11)
  ruc: string;

  @ApiProperty({
    name: 'address',
    description: 'Physical address of the business',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  address: string;

  @ApiProperty({
    name: 'legalRepName',
    description: 'Name of the legal representative of the business',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  legalRepName: string;

  @ApiProperty({
    name: 'legalRepDni',
    description: 'DNI of the legal representative of the business',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8)
  @Transform(({ value }) => value.trim())
  legalRepDni: string;
}
