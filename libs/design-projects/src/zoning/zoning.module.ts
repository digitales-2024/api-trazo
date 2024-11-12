import { Module } from '@nestjs/common';
import { ZoningService } from './zoning.service';
import { ZoningController } from './zoning.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [ZoningController],
  providers: [ZoningService],
  imports: [PrismaModule],
  exports: [ZoningService],
})
export class ZoningModule {}
