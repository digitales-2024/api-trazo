import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '@prisma/prisma';
import { ResourceModule } from '../resource/resource.module';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  imports: [PrismaModule, ResourceModule, SupplierModule],
})
export class PurchaseOrderModule {}
