import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateMovementDetailDto } from './create-movement-detail.dto';
import { TypeMovements } from '@prisma/client';

export class CreateMovementDto {
  @ApiProperty({
    name: 'dateMovement',
    description: 'Date of the movement',
    example: '2021-09-21',
  })
  @IsDateString()
  @IsNotEmpty()
  dateMovement: string;

  @ApiProperty({
    name: 'nameTypeMovement',
    description:
      'Name of the type of movement to set the movement to. Can only be INPUT or OUTPUT',
    example: 'INPUT',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['INPUT', 'OUTPUT'], {
    message: "nameTypeMovement must be either 'INPUT' or 'OUTPUT'",
  })
  @Transform(({ value }) => value.toUpperCase())
  type: TypeMovements;

  @ApiProperty({
    name: 'description',
    description: 'Description of the movement',
    example: 'Description of the movement',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    name: 'warehouseId',
    description: 'Id of the warehouse',
    example: 'id del almacen',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  warehouseId: string;

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
        subtotal: 0,
        resourceId: 'id del recurso',
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMovementDetailDto)
  movementDetail: CreateMovementDetailDto[];
}
