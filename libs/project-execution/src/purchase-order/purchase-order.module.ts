import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '@prisma/prisma';
import { SupplierModule } from '../supplier/supplier.module';
import { ResourceModule } from '../resource/resource.module';
import { RequirementsModule } from 'libs/requirements/src';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  imports: [PrismaModule, ResourceModule, SupplierModule, RequirementsModule],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
