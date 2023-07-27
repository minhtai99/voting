import { MailerService } from '@nestjs-modules/mailer';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProcessorName } from './mail.enum';
import { SendMailDto } from './dto/send-mail.dto';
import * as fs from 'fs';

@Processor('send-email')
export class MailProcessor {
  constructor(private readonly mailerService: MailerService) {}
  private readonly logger = new Logger(MailProcessor.name);

  @Process(ProcessorName.SEND_EMAIL)
  async sendEmailForgotPass(job: Job) {
    const sendMailDto: SendMailDto = job.data;
    await this.mailerService.sendMail({
      to: sendMailDto.to,
      subject: sendMailDto.subject,
      template: sendMailDto.template,
      context: sendMailDto.context,
    });
  }

  @Process(ProcessorName.SEND_EMAIL_WITH_FILE)
  async sendEmailInvitationVote(job: Job) {
    const sendMailDto: SendMailDto = job.data;
    await this.mailerService.sendMail({
      to: sendMailDto.to,
      subject: sendMailDto.subject,
      template: sendMailDto.template,
      attachments: sendMailDto.attachments,
      context: sendMailDto.context,
    });
    sendMailDto.attachments.forEach((attachment) => {
      if (typeof attachment.path === 'string' && attachment.path) {
        fs.unlink(attachment.path, (err) => err);
      }
    });
  }

  @OnQueueFailed()
  async onFailed(job: Job, err: Error) {
    this.logger.error(err);
  }
}
