import { Module } from '@nestjs/common';
import { SunatChangeService } from './sunat-change.service';
import { ChangeModule } from './change/change.module';

@Module({
  providers: [SunatChangeService],
  exports: [SunatChangeService, SunatChangeModule],
  imports: [ChangeModule],
})
export class SunatChangeModule {}
