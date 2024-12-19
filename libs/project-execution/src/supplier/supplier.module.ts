import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  imports: [PrismaModule],
  exports: [SupplierService],
})
export class SupplierModule {}
