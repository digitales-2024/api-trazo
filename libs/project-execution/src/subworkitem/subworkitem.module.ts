import { Module } from '@nestjs/common';
import { SubworkitemService } from './subworkitem.service';
import { SubworkitemController } from './subworkitem.controller';
import { PrismaModule } from '@prisma/prisma';
import { ApusModule } from '../apus/apus.module';

@Module({
  controllers: [SubworkitemController],
  providers: [SubworkitemService],
  imports: [PrismaModule, ApusModule],
})
export class SubworkitemModule {}
