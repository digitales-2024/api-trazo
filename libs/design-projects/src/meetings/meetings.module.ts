import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsTemplate } from './meetings.template';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsTemplate],
})
export class MeetingsModule {}
