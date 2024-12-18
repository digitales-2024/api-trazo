import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  imports: [PrismaModule],
})
export class PurchaseOrderModule {}
