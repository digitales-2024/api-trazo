import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ExportProjectPdfDto {
  @ApiProperty({
    description: 'Date on which the contract is to be signed',
    example: '[]',
  })
  @IsDateString()
  @IsNotEmpty()
  signingDate: Date;
}
