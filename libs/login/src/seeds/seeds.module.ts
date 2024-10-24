import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [SeedsController],
  providers: [SeedsService],
  imports: [PrismaModule],
})
export class SeedsModule {}
