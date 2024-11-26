import { Module } from '@nestjs/common';
import { ApusService } from './apus.service';
import { ApusController } from './apus.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';

@Module({
  controllers: [ApusController],
  providers: [ApusService],
  imports: [PrismaModule, AuditModule],
})
export class ApusModule {}
