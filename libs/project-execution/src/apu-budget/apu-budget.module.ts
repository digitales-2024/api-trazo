import { Module } from '@nestjs/common';
import { ApuBudgetService } from './apu-budget.service';
import { ApuBudgetController } from './apu-budget.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [ApuBudgetController],
  providers: [ApuBudgetService],
  imports: [PrismaModule],
})
export class ApuBudgetModule {}
