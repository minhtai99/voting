import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from 'src/users/dto/user.dto';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmailForgotPass(receiver: UserDto, token: string) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/reset-password/${token}`;

    await this.mailerService.sendMail({
      to: receiver.email,
      subject: 'Forgot Your Password?',
      template: './forgot-password',
      context: {
        url,
      },
    });
  }
}
