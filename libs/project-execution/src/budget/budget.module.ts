import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@prisma/prisma';
import { QuotationsModule } from '@design-projects/design-projects/quotations/quotations.module';
import { ClientsModule } from '@clients/clients';
import { ProjectModule } from '@design-projects/design-projects/project/project.module';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
  imports: [PrismaModule, QuotationsModule, ClientsModule, ProjectModule],
})
export class BudgetModule {}
