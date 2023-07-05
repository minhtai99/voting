import { TokenType } from './../auth/auth.enum';
import { AuthService } from '../auth/auth.service';
import { PollsService } from './../polls/polls.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';
import { PollDto } from 'src/polls/dto/poll.dto';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
    private readonly authService: AuthService,
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

  async sendEmailStartedPoll(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);
    const token = await this.getPollPermissionToken(poll);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${token}`;

    Promise.all(
      poll.invitedUsers.map(
        async (receiver) =>
          await this.mailerService.sendMail({
            to: receiver.email,
            subject: `[Invitation] ${poll.title}`,
            template: './invitation-vote',
            context: {
              url,
              author: poll.author.firstName + ' ' + poll.author.lastName,
              question: poll.question,
              endTime: poll.endDate,
            },
          }),
      ),
    );
  }

  async getPollPermissionToken(poll: PollDto) {
    const pollPermissionJwt = this.authService.createJWT(
      { pollId: poll.id },
      TokenType.POLL_PERMISSION,
    );
    await this.pollsService.updatePermissionTokenHash(
      poll.id,
      pollPermissionJwt,
    );
    return pollPermissionJwt;
  }
}
