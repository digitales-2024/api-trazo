import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseOrderDetailDto } from './create-purchase-order-detail.dto';

export class CreatePurchaseOrderDto {
  @ApiProperty({
    name: 'orderDate',
    description: 'Date of the purchase order',
    example: '2021-09-21',
  })
  @IsNotEmpty()
  @IsDateString()
  orderDate: string;

  @ApiProperty({
    name: 'estimatedDeliveryDate',
    description: 'Estimated delivery date of the purchase order',
    example: '2021-09-21',
  })
  @IsNotEmpty()
  @IsDateString()
  estimatedDeliveryDate: string;

  @ApiProperty({
    name: 'supplierId',
    description: 'Id of the supplier',
    example: 'id del proveedor',
  })
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  supplierId: string;

  @ApiProperty({
    name: 'requirementsId',
    description: 'Id of the requirements',
    example: 'id de los requerimientos',
  })
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  requirementsId: string;

  @ApiProperty({
    name: 'purchaseOrderDetail',
    description: 'Array of details of the purchase order',
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
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderDetailDto)
  purchaseOrderDetail: CreatePurchaseOrderDetailDto[];
}
