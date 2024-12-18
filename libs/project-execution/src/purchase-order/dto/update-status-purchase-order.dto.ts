import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '@prisma/client';
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
  @IsIn(['PENDING', 'DELIVERED', 'REJECTED'], {
    message: "newStatus must be either 'PENDING', 'DELIVERED' or 'REJECTED'",
  })
  newStatus: PurchaseOrderStatus;
}
