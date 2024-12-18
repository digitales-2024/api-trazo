import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '@prisma/prisma';
import { ResourceModule } from '../resource/resource.module';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  imports: [PrismaModule, ResourceModule],
})
export class PurchaseOrderModule {}
