import { PollsModule } from './../polls/polls.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { MailListener } from './listeners/mail.listener';
import { FilesModule } from '../files/files.module';
import { UsersModule } from 'src/users/users.module';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail.processor';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
          pool: true,
          maxConnections: 1,
          rateDelta: 3500,
          rateLimit: 1,
        },
        defaults: {
          from: `"SS_Intern" <${configService.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, '../../', 'mails/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    PollsModule,
    FilesModule,
    UsersModule,
    BullModule.registerQueue({
      name: 'send-email',
    }),
  ],
  controllers: [],
  providers: [MailsService, MailListener, MailProcessor],
  exports: [MailsService, MailListener],
})
export class MailsModule {}
