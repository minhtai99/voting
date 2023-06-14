import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailsService } from 'src/mails/mails.service';
import { UserDto } from 'src/users/dto/user.dto';
import { MailEvent } from '../mails.enum';
import { MSG_ERROR_SEND_MAIL } from 'src/constants/message.constant';

interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}

@Injectable()
export class SendMailEvent {
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
