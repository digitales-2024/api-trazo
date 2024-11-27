import { Module } from '@nestjs/common';
import { WorkitemsService } from './workitems.service';
import { WorkitemsController } from './workitems.controller';

@Module({
  controllers: [WorkitemsController],
  providers: [WorkitemsService],
})
export class WorkitemsModule {}
