import { Module } from '@nestjs/common';
import { WorkitemsService } from './workitems.service';
import { WorkitemsController } from './workitems.controller';
import { PrismaModule } from '@prisma/prisma';
import { ApusModule } from '../apus/apus.module';

@Module({
  controllers: [WorkitemsController],
  providers: [WorkitemsService],
  imports: [PrismaModule, ApusModule],
})
export class WorkitemsModule {}
