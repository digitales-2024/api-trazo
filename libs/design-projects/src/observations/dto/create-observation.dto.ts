import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateObservationDto {
  @ApiProperty({
    description: 'ID of the project charter this observation belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  projectCharterId: string;

  @ApiProperty({
    description: 'The observation text',
    example: 'Client requested changes to the facade design',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  observation: string;
}
