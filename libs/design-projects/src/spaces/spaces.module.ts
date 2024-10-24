import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [SpacesController],
  providers: [SpacesService],
  imports: [PrismaModule],
  exports: [SpacesModule],
})
export class SpacesModule {}
