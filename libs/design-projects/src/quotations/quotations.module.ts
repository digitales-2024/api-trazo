import { forwardRef, Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from '@clients/clients';
import { UsersModule } from '@login/login/admin/users/users.module';
import { QuotationTemplate } from './quotations.template';
import { LevelsModule } from '../levels/levels.module';

@Module({
  imports: [
    AuditModule,
    PrismaModule,
    ClientsModule,
    UsersModule,
    forwardRef(() => LevelsModule),
  ],
  exports: [QuotationsService],
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationTemplate],
})
export class QuotationsModule {}
