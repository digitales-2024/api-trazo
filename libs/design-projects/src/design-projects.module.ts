import { Module } from '@nestjs/common';
import { DesignProjectsService } from './design-projects.service';
import { SpacesModule } from './spaces/spaces.module';
import { QuotationsModule } from './quotations/quotations.module';
import { LevelsModule } from './levels/levels.module';
import { ProjectModule } from './project/project.module';

@Module({
  providers: [DesignProjectsService],
  exports: [DesignProjectsService, DesignProjectsModule],
  imports: [SpacesModule, QuotationsModule, LevelsModule, ProjectModule],
})
export class DesignProjectsModule {}
