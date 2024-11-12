import { Module } from '@nestjs/common';
import { ProjectCharterService } from './project-charter.service';
import { ProjectCharterController } from './project-charter.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';

@Module({
  controllers: [ProjectCharterController],
  providers: [ProjectCharterService],
  imports: [PrismaModule, AuditModule],
  exports: [ProjectCharterService],
})
export class ProjectCharterModule {}
