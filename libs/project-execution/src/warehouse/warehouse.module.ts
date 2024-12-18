import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService],
  imports: [PrismaModule],
  exports: [WarehouseService],
})
export class WarehouseModule {}
