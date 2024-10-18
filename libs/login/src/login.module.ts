import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { AdminModule } from './admin/admin.module'; // Importando AdminModule
import { PrismaModule } from './prisma/prisma.module';
import { SeedsModule } from './seeds/seeds.module';
import { TypedEventEmitterModule } from './event-emitter/typed-event-emitter.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './email/email.module';


@Module({
  providers: [LoginService],
  exports: [LoginService, AdminModule, PrismaModule], // Exportando AdminModule
  imports: [AdminModule, PrismaModule, SeedsModule, TypedEventEmitterModule, EventEmitterModule.forRoot(),EmailModule],
})
export class LoginModule {}
