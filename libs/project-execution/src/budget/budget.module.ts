import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@prisma/prisma';
import { QuotationsModule } from '@design-projects/design-projects/quotations/quotations.module';
import { ClientsModule } from '@clients/clients';
import { ProjectModule } from '@design-projects/design-projects/project/project.module';
import { CategoryModule } from '../category/category.module';
import { SubcategoryModule } from '../subcategory/subcategory.module';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService],
  imports: [
    PrismaModule,
    QuotationsModule,
    ClientsModule,
    ProjectModule,
    CategoryModule,
    SubcategoryModule,
  ],
  exports: [BudgetService],
})
export class BudgetModule {}
