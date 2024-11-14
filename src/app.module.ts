import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from '@login/login';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from '@clients/clients';
import { BusinessModule } from '@business/business';
import { DesignProjectsModule } from '@design-projects/design-projects';
import { SunatChangeModule } from '@sunat-change/sunat-change';

@Module({
  imports: [
    LoginModule,
    PrismaModule,
    ClientsModule,
    DesignProjectsModule,
    BusinessModule,
    SunatChangeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
