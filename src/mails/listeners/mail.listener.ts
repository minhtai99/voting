import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailsService } from 'src/mails/mails.service';
import { MailEvent } from '../mails.enum';
import { MSG_ERROR_SEND_MAIL } from 'src/constants/message.constant';
import { MailForgotPassPayload } from 'src/interfaces/send-mail.interface';

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailsService) {}
  private readonly logger = new Logger(MailsService.name);

  @OnEvent(MailEvent.SEND_MAIL_FORGOT_PASSWORD)
  async handleSendEmailForgotPass(payload: MailForgotPassPayload) {
    try {
      const { receiver, token } = payload;
      this.logger.log(`Send verification email : ${receiver.email}`);
      await this.mailService.sendEmailForgotPass(receiver, token);
    } catch {
      throw new BadRequestException(MSG_ERROR_SEND_MAIL);
    }
  }
}
