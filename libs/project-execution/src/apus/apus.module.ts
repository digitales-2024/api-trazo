import { Module } from '@nestjs/common';
import { ApusService } from './apus.service';
import { ApusController } from './apus.controller';

@Module({
  controllers: [ApusController],
  providers: [ApusService],
})
export class ApusModule {}
