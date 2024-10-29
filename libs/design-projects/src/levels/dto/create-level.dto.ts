import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the level',
    example: 'Primer nivel',
  })
  @IsString({ message: 'name should be a string' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim?.())
  name: string;

  // Relacion con Client
  @ApiProperty({
    name: 'quotationId',
    description: 'Id of the quotation this level belongs to',
  })
  @IsString()
  @IsNotEmpty()
  quotationId: string;
}
