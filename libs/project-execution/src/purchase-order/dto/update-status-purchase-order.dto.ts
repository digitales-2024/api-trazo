import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({
    name: 'newStatus',
    description:
      'New status to set the purchase order to. Can only be PENDING, DELIVERED, REJECTED',
    example: 'PENDING',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['PENDING', 'DELIVERED', 'REJECTED'], {
    message: "newStatus must be either 'PENDING', 'DELIVERED' or 'REJECTED'",
  })
  newStatus: PurchaseOrderStatus;
}
