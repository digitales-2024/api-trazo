import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsNotEmpty, IsString } from 'class-validator';
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
  rucDni?: string;
  address?: string;
  phone?: string;
  province?: string;
  department?: string;
}
