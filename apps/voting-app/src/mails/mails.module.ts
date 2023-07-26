import { PollsModule } from './../polls/polls.module';
import { Global, Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailListener } from './listeners/mail.listener';
import { FilesModule } from '../files/files.module';
import { UsersModule } from './../users/users.module';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail.processor';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    PollsModule,
    FilesModule,
    UsersModule,
    BullModule.registerQueue({
      name: 'send-email',
    }),
    JwtModule.register({}),
    ClientsModule.register([
      { name: 'MAIL_SERVICE', transport: Transport.TCP },
    ]),
  ],
  controllers: [],
  providers: [MailsService, MailListener, MailProcessor],
  exports: [MailsService, MailListener],
})
export class MailsModule {}
