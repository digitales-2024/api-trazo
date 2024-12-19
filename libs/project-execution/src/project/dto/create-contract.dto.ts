import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateContractDto {
  @ApiProperty({
    description:
      'Date on which the contract is to be signed, in format ISO8601',
    example: '2024-10-25',
  })
  @IsDateString()
  @IsNotEmpty()
  signingDate: string;

  @ApiProperty({
    description:
      'Percentage of the total cost for first payment (initial), as a number between 0-1',
    example: 0.4,
  })
  @IsNumber()
  @IsPositive()
  firstPaymentPercentage: number;

  @ApiProperty({
    description:
      'How to address the client of the contract ("El Sr.", "La Sra.", "Los Sres.", etc)',
    example: 'La Srta.',
  })
  @IsString()
  @IsNotEmpty()
  adressing: string;
}
