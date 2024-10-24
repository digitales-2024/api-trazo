import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from '@login/login';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from './modules/admin/clients/clients.module';
import { BusinessModule } from './modules/admin/business/business.module';

@Module({
  imports: [LoginModule, PrismaModule, ClientsModule, BusinessModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
