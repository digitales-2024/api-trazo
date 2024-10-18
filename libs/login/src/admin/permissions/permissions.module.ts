import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from '@login/login/prisma/prisma.module';


@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
  imports: [PrismaModule]
})
export class PermissionsModule {}
