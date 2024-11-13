import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateProjectCharterObservationDto {
  @ApiProperty({
    description: 'ID of the project charter this observation belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  projectCharterId: string;

  @ApiProperty({
    description: 'ID of the related design project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  designProjectId: string;

  @ApiProperty({
    description: 'The observation text',
    example: 'Client requested changes to the facade design',
  })
  @IsString()
  @IsNotEmpty()
  observation: string;
}
