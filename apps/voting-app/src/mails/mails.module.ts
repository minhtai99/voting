import { PollsModule } from './../polls/polls.module';
import { Global, Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailListener } from './listeners/mail.listener';
import { FilesModule } from '../files/files.module';
import { UsersModule } from './../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    PollsModule,
    FilesModule,
    UsersModule,
    JwtModule.register({}),
    ClientsModule.register([
      { name: 'MAIL_SERVICE', transport: Transport.TCP },
    ]),
  ],
  controllers: [],
  providers: [MailsService, MailListener],
  exports: [MailsService, MailListener],
})
export class MailsModule {}
