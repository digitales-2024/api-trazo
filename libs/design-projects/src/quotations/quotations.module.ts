import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from '@clients/clients';
import { UsersModule } from '@login/login/admin/users/users.module';

@Module({
  imports: [AuditModule, PrismaModule, ClientsModule, UsersModule],
  exports: [QuotationsService],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
