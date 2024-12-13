import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateZoningDto } from './create-zoning.dto';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateZoningDto extends PartialType(CreateZoningDto) {
  @ApiProperty({
    name: 'zoneCode',
    description: 'Zoning code',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  zoneCode?: string;

  @ApiProperty({
    name: 'description',
    description: 'Zoning description',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    name: 'buildableArea',
    description: 'Percentage of buildable area',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  buildableArea?: number;

  @ApiProperty({
    name: 'openArea',
    description: 'Percentage of open area',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  openArea?: number;
}
