import { Module } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { ProjectCharterModule } from '../project-charter/project-charter.module';
import { ObservationsTemplate } from './observations.template';
import { ProjectModule } from '../project/project.module';

@Module({
  controllers: [ObservationsController],
  providers: [ObservationsService, ObservationsTemplate],
  imports: [PrismaModule, AuditModule, ProjectCharterModule, ProjectModule],
  exports: [ObservationsService],
})
export class ObservationsModule {}
