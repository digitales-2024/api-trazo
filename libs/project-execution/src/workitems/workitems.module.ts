import { Module } from '@nestjs/common';
import { WorkitemsService } from './workitems.service';
import { WorkitemsController } from './workitems.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [WorkitemsController],
  providers: [WorkitemsService],
  imports: [PrismaModule],
})
export class WorkitemsModule {}
