import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateObservationDto {
  @ApiProperty({
    description: 'The observation text',
    example: 'Client requested changes to the facade design',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  observation: string;

  @ApiProperty({
    description: 'Meeting date of the recorded observation',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  meetingDate?: string;
}
