import { Module } from '@nestjs/common';
import { DesignProjectsService } from './design-projects.service';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  providers: [DesignProjectsService],
  exports: [DesignProjectsService, DesignProjectsModule],
  imports: [SpacesModule],
})
export class DesignProjectsModule {}
