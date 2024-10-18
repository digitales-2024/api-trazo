import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from '@login/login';
import { PrismaModule } from '@prisma/prisma';

@Module({
  imports: [LoginModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
