import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { PrismaModule } from '@prisma/prisma';

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
