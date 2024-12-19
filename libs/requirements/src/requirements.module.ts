import { Module } from '@nestjs/common';
import { RequirementService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { PrismaModule } from '@prisma/prisma';
import { UsersModule } from '@login/login/admin/users/users.module';
import { ExecutionProjectModule } from '@project-execution/project-execution/project/project.module';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementService],
  imports: [PrismaModule, UsersModule, ExecutionProjectModule],
  exports: [RequirementService],
})
export class RequirementsModule {}
