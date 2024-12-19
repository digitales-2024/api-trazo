import { Module } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { PrismaModule } from '@prisma/prisma';
import { ResourceModule } from '../resource/resource.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { PurchaseOrderModule } from '../purchase-order/purchase-order.module';

@Module({
  controllers: [MovementsController],
  providers: [MovementsService],
  imports: [PrismaModule, ResourceModule, WarehouseModule, PurchaseOrderModule],
})
export class MovementsModule {}
