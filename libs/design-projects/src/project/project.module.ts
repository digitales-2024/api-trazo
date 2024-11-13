import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { ClientsModule } from '@clients/clients';
import { UsersModule } from '@login/login/admin/users/users.module';
import { ProjectTemplate } from './project.template';
import { QuotationsModule } from '../quotations/quotations.module';
import { BusinessModule } from '@business/business';
import { ProjectCharterModule } from '../project-charter/project-charter.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectTemplate],
  imports: [
    PrismaModule,
    AuditModule,
    ClientsModule,
    UsersModule,
    QuotationsModule,
    BusinessModule,
    ProjectCharterModule,
  ],
})
export class ProjectModule {}
