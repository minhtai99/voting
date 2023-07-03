import { MailInvitationVotePayload } from './interfaces/send-mail.interface';
import { PollsService } from './../polls/polls.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
  ) {}

  async sendEmailForgotPass(receiver: UserDto, token: string) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: receiver.email,
      subject: 'Reset Your Password',
      template: './forgot-password',
      context: {
        url,
      },
    });
  }

  async sendEmailStartedPoll(payload: MailInvitationVotePayload) {
    const url = `${this.configService.get('FRONTEND_URL')}/vote/poll?id=${
      payload.pollId
    }`;
    const poll = await this.pollsService.findPollById(payload.pollId);

    payload.invitedUsers.map(
      async (receiver) =>
        await this.mailerService.sendMail({
          to: receiver.email,
          subject: `[Invitation] ${poll.title}`,
          template: './invitation-vote',
          context: {
            url,
            author: payload.inviter.firstName + ' ' + payload.inviter.lastName,
            question: poll.question,
            endTime: poll.endDate,
          },
        }),
    );
  }
}
