import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateZoningDto {
  @ApiProperty({
    name: 'zoneCode',
    description: 'Zoning code',
  })
  @IsNotEmpty()
  @IsString()
  zoneCode: string;

  @ApiProperty({
    name: 'description',
    description: 'Zoning description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    name: 'buildableArea',
    description: 'Percentage of buildable area',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  buildableArea: number;

  @ApiProperty({
    name: 'openArea',
    description: 'Percentage of open area',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  openArea: number;
}
