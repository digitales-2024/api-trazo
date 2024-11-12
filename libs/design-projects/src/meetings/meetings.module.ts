import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsTemplate } from './meetings.template';
import { ProjectModule } from '../project/project.module';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsTemplate],
  imports: [ProjectModule],
})
export class MeetingsModule {}
