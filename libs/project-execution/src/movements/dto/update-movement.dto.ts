import { PartialType } from '@nestjs/swagger';
import { CreateMovementDto } from './create-movement.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateMovementDetailDto } from './create-movement-detail.dto';
import { TypeMovements } from '@prisma/client';

export class UpdateMovementDto extends PartialType(CreateMovementDto) {
  @ApiProperty({
    name: 'dateMovement',
    description: 'Date of the movement',
    example: '2021-09-21',
  })
  @IsDateString()
  @IsOptional()
  dateMovement?: string;

  @ApiProperty({
    name: 'type',
    description:
      'Type of movement to set the movement to. Can only be INPUT or OUTPUT',
    example: 'INPUT',
  })
  @IsString()
  @IsOptional()
  @IsIn(['INPUT', 'OUTPUT'], {
    message: "type must be either 'INPUT' or 'OUTPUT'",
  })
  @Transform(({ value }) => (value ? value.toUpperCase() : value))
  type?: TypeMovements;

  @ApiProperty({
    name: 'description',
    description: 'Description of the movement',
    example: 'Description of the movement',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    name: 'warehouseId',
    description: 'Id of the warehouse',
    example: 'id del almacen',
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({
    name: 'purchaseId',
    description: 'Id of the purchase order',
    example: 'id de la orden de compra',
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @ApiProperty({
    name: 'movementDetail',
    description: 'Array of details of the movement',
    required: false,
    example: [
      {
        quantity: 0,
        unitCost: 0,
        resourceId: 'id del recurso',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMovementDetailDto)
  movementDetail?: CreateMovementDetailDto[];
}
