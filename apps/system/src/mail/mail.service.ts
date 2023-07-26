import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';
import * as fs from 'fs';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(sendMailDto: SendMailDto, template: string) {
    await this.mailerService.sendMail({
      to: sendMailDto.to,
      subject: sendMailDto.subject,
      template: template,
      context: sendMailDto.context,
    });
  }

  async sendMailWithFile(sendMailDto: SendMailDto, template: string) {
    await this.mailerService.sendMail({
      to: sendMailDto.to,
      subject: sendMailDto.subject,
      template: template,
      context: sendMailDto.context,
      attachments: [
        {
          path: sendMailDto.pathFile,
        },
      ],
    });
    fs.unlink(sendMailDto.pathFile, (err) => err);
  }
}
