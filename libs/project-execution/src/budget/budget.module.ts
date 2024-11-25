import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@prisma/prisma';
import { QuotationsModule } from '@design-projects/design-projects/quotations/quotations.module';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
  imports: [PrismaModule, QuotationsModule],
})
export class BudgetModule {}
