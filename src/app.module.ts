import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from '@login/login';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from '@clients/clients';

@Module({
  imports: [LoginModule, PrismaModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
