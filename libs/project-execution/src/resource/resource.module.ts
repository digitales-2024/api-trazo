import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [ResourceController],
  providers: [ResourceService],
  imports: [PrismaModule, AuditModule],
  exports: [ResourceService],
})
export class ResourceModule {}
