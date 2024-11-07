import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { QuotationsModule } from '../quotations/quotations.module';
import { ContractsTemplate } from './contracts.template';

@Module({
  controllers: [ContractsController],
  imports: [QuotationsModule],
  providers: [ContractsService, ContractsTemplate],
})
export class ContractsModule {}
