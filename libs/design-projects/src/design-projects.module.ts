import { Module } from '@nestjs/common';
import { DesignProjectsService } from './design-projects.service';
import { SpacesModule } from './spaces/spaces.module';
import { QuotationsModule } from './quotations/quotations.module';
import { LevelsModule } from './levels/levels.module';
import { ProjectModule } from './project/project.module';
import { MeetingsModule } from './meetings/meetings.module';

@Module({
  providers: [DesignProjectsService],
  exports: [DesignProjectsService, DesignProjectsModule],
  imports: [
    SpacesModule,
    QuotationsModule,
    LevelsModule,
    ProjectModule,
    MeetingsModule,
  ],
})
export class DesignProjectsModule {}
