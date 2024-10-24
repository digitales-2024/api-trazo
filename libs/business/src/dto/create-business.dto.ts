import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBusinessDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the business',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    name: 'ruc',
    description: 'RUC of the business',
  })
  @IsNumberString()
  @IsNotEmpty()
  @Length(11, 11)
  ruc: string;

  @ApiProperty({
    name: 'address',
    description: 'Physical address of the business',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  address: string;

  @ApiProperty({
    name: 'legalRepName',
    description: 'Name of the legal representative of the business',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  legalRepName: string;

  @ApiProperty({
    name: 'legalRepDni',
    description: 'DNI of the legal representative of the business',
  })
  @IsNumberString()
  @IsNotEmpty()
  @Length(8, 8)
  @Transform(({ value }) => value.trim())
  legalRepDni: string;
}
