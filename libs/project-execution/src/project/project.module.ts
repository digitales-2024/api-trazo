import { Module } from '@nestjs/common';
import { ExecutionProjectService } from './project.service';
import { ExecutionProjectController } from './project.controller';
import { PrismaModule } from '@prisma/prisma';
import { AuditModule } from '@login/login/admin/audit/audit.module';
import { ClientsModule } from '@clients/clients';
import { UsersModule } from '@login/login/admin/users/users.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  controllers: [ExecutionProjectController],
  providers: [ExecutionProjectService],
  imports: [
    PrismaModule,
    AuditModule,
    ClientsModule,
    UsersModule,
    BudgetModule,
  ],
})
export class ExecutionProjectModule {}
