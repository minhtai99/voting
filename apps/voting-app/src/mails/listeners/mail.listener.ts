import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailsService } from '../../mails/mails.service';
import { MailEvent } from '../mails.enum';
import {
  MailForgotPassPayload,
  MailInvitationVote,
} from '../interfaces/send-mail.interface';

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailsService) {}
  private readonly logger = new Logger(MailsService.name);

  @OnEvent(MailEvent.SEND_MAIL_FORGOT_PASSWORD)
  async handleSendEmailForgotPass(payload: MailForgotPassPayload) {
    try {
      const { receiver, token } = payload;
      await this.mailService.sendEmailForgotPass(receiver, token);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_INVITATION_VOTE)
  async handleSendEmailInvitationVote(payload: MailInvitationVote) {
    try {
      await this.mailService.sendEmailStartedPoll(payload.pollId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_ADD_INVITATION_VOTE)
  async handleSendEmailAddInvitationVote(payload: MailInvitationVote) {
    try {
      await this.mailService.sendEmailInvitePeople(
        payload.pollId,
        payload.invitedUsers,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_POLL_ENDED_PARTICIPANT)
  async handleSendEmailPollEndParticipant(pollId: number) {
    try {
      await this.mailService.sendEmailPollEndedParticipants(pollId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_POLL_ENDED_AUTHOR)
  async handleSendEmailPollEndAuthor(pollId: number) {
    try {
      await this.mailService.sendEmailPollEndedAuthor(pollId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(MailEvent.SEND_MAIL_VOTE_REMINDER)
  async handleSendEmailVoteReminder(pollId: number) {
    try {
      await this.mailService.sendEmailVoteReminder(pollId);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
