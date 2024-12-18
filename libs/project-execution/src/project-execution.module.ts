import { Module } from '@nestjs/common';
import { ProjectExecutionService } from './project-execution.service';
import { ResourceModule } from './resource/resource.module';
import { BudgetModule } from './budget/budget.module';
import { CategoryModule } from './category/category.module';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { ApusModule } from './apus/apus.module';
import { WorkitemsModule } from './workitems/workitems.module';
import { SubworkitemModule } from './subworkitem/subworkitem.module';
import { ApuBudgetModule } from './apu-budget/apu-budget.module';
import { ExecutionProjectModule } from './project/project.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  providers: [ProjectExecutionService],
  exports: [ProjectExecutionService],
  imports: [
    ResourceModule,
    BudgetModule,
    CategoryModule,
    SubcategoryModule,
    ExecutionProjectModule,
    ApusModule,
    WorkitemsModule,
    SubworkitemModule,
    ApuBudgetModule,
    PurchaseOrderModule,
    SupplierModule,
  ],
})
export class ProjectExecutionModule {}
