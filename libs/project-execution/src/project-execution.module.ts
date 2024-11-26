import { Module } from '@nestjs/common';
import { ProjectExecutionService } from './project-execution.service';
import { ResourceModule } from './resource/resource.module';
import { BudgetModule } from './budget/budget.module';
import { CategoryModule } from './category/category.module';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { ApusModule } from './apus/apus.module';

@Module({
  providers: [ProjectExecutionService],
  exports: [ProjectExecutionService],
  imports: [
    ResourceModule,
    BudgetModule,
    CategoryModule,
    SubcategoryModule,
    ApusModule,
  ],
})
export class ProjectExecutionModule {}
