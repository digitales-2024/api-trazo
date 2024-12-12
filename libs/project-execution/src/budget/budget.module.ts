import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@prisma/prisma';
import { QuotationsModule } from '@design-projects/design-projects/quotations/quotations.module';
import { ClientsModule } from '@clients/clients';
import { ProjectModule } from '@design-projects/design-projects/project/project.module';
import { CategoryModule } from '../category/category.module';
import { SubcategoryModule } from '../subcategory/subcategory.module';
import { BudgetTemplate } from './budgets.template';
import { BusinessModule } from '@business/business';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, BudgetTemplate],
  imports: [
    PrismaModule,
    QuotationsModule,
    ClientsModule,
    ProjectModule,
    CategoryModule,
    SubcategoryModule,
    BusinessModule,
  ],
})
export class BudgetModule {}
