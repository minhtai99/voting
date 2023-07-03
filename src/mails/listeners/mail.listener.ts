import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailsService } from '../../mails/mails.service';
import { MailEvent } from '../mails.enum';
import {
  MailForgotPassPayload,
  MailInvitationVotePayload,
} from '../interfaces/send-mail.interface';

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
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_INVITATION_VOTE)
  async handleSendEmailInvitationVote(payload: MailInvitationVotePayload) {
    try {
      await this.mailService.sendEmailStartedPoll(payload);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
