import { forwardRef, Module } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  controllers: [LevelsController],
  providers: [LevelsService],
  imports: [PrismaModule, AuditModule, forwardRef(() => QuotationsModule)],
  exports: [LevelsService],
})
export class LevelsModule {}
