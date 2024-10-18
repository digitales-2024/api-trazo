import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolModule } from './rol/rol.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '@login/login/prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { ModulesModule } from './modules/modules.module';
import { PermissionsModule } from './permissions/permissions.module';



@Module({
  imports: [
    UsersModule,
    AuthModule,
    RolModule,
    PrismaModule,
    AuditModule,
    ModulesModule,
    PermissionsModule,

  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: []
})
export class AdminModule {}
