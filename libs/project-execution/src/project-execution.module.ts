import { Module } from '@nestjs/common';
import { ProjectExecutionService } from './project-execution.service';
import { ResourceModule } from './resource/resource.module';

@Module({
  providers: [ProjectExecutionService],
  exports: [ProjectExecutionService],
  imports: [ResourceModule],
})
export class ProjectExecutionModule {}
