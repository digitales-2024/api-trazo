import { Module } from '@nestjs/common';
import { ProjectExecutionService } from './project-execution.service';
import { ResourceModule } from './resource/resource.module';
import { BudgetModule } from './budget/budget.module';

@Module({
  providers: [ProjectExecutionService],
  exports: [ProjectExecutionService],
  imports: [ResourceModule, BudgetModule],
})
export class ProjectExecutionModule {}
