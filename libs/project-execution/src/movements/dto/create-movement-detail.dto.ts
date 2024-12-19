import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateMovementDetailDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the resource',
    example: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    name: 'unitCost',
    description: 'Unit cost of the resource',
    example: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  unitCost: number;

  @ApiProperty({
    name: 'subtotal',
    description: 'Subtotal of the resource',
    example: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

  @ApiProperty({
    name: 'resourceId',
    description: 'Id of the resource',
    example: 'id del recurso',
  })
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  resourceId: string;
}
