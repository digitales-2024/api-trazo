import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ExportProjectPdfDto {
  @ApiProperty({
    description:
      'Date on which the contract is to be signed, in format ISO8601',
    example: '2024-10-25',
  })
  @IsDateString()
  @IsNotEmpty()
  signingDate: Date;
}
