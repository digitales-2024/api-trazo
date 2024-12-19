import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from '@login/login';
import { PrismaModule } from '@prisma/prisma';
import { ClientsModule } from '@clients/clients';
import { BusinessModule } from '@business/business';
import { DesignProjectsModule } from '@design-projects/design-projects';
import { SunatChangeModule } from '@sunat-change/sunat-change';
import { ProjectExecutionModule } from '@project-execution/project-execution';
import { RequirementsModule } from 'libs/requirements/src';

@Module({
  imports: [
    LoginModule,
    PrismaModule,
    ClientsModule,
    DesignProjectsModule,
    BusinessModule,
    SunatChangeModule,
    ProjectExecutionModule,
    RequirementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
