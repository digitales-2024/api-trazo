import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { ClientsModule } from '@clients/clients';
import { UsersModule } from '@login/login/admin/users/users.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [
    PrismaModule,
    AuditModule,
    ClientsModule,
    UsersModule,
    QuotationsModule,
  ],
})
export class ProjectModule {}
