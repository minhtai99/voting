import { PollsModule } from './../polls/polls.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module, forwardRef } from '@nestjs/common';
import { MailsService } from './mails.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { MailListener } from './listeners/mail.listener';
import { AuthModule } from 'src/auth/auth.module';

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
    forwardRef(() => AuthModule),
  ],
  controllers: [],
  providers: [MailsService, MailListener],
  exports: [MailsService, MailListener],
})
export class MailsModule {}
