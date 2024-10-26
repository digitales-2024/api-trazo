import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  imports: [PrismaModule],
  exports: [ClientsService],
})
export class ClientsModule {}
