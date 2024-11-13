import { Module } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { ProjectCharterModule } from '../project-charter/project-charter.module';

@Module({
  controllers: [ObservationsController],
  providers: [ObservationsService],
  imports: [PrismaModule, AuditModule, ProjectCharterModule],
  exports: [ObservationsService],
})
export class ObservationsModule {}
