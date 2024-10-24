import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
