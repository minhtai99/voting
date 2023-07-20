import { UsersService } from './../users/users.service';
import { PollDto } from 'src/polls/dto/poll.dto';
import { PollsService } from './../polls/polls.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';
import { FilesService } from '../files/files.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ProcessorName } from './mails.enum';

@Injectable()
export class MailsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    @InjectQueue('send-email') private readonly sendEmailQueue: Queue,
  ) {}

  async sendEmailForgotPass(receiver: UserDto, token: string) {
    const url = `${this.configService.get(
      'FRONTEND_URL',
    )}/auth/reset-password?token=${token}`;
    await this.sendEmailQueue.add(ProcessorName.FORGOT_PASSWORD, {
      url,
      receiver,
    });
  }

  async sendEmailStartedPoll(pollId: number) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;
    poll.invitedUsers.forEach(
      async (receiver) =>
        await this.sendEmailQueue.add(ProcessorName.INVITATION_VOTE, {
          url,
          receiver,
          poll,
        }),
    );
  }

  async sendEmailInvitePeople(pollId: number, newInvitedUsers: number[]) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;

    poll.invitedUsers.forEach(async (receiver) => {
      if (newInvitedUsers.some((userId) => userId === receiver.id)) {
        await this.sendEmailQueue.add(ProcessorName.INVITATION_VOTE, {
          url,
          receiver,
          poll,
        });
      }
    });
  }

  async sendEmailPollEndedParticipants(pollId: number) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);

    poll.votes.forEach(async (vote) => {
      await this.sendEmailQueue.add(ProcessorName.POLL_ENDED_PARTICIPANT, {
        vote,
        poll,
      });
    });
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);

    const excelFile = await this.filesService.exportDataToBuffer(pollId);

    await this.sendEmailQueue.add(ProcessorName.POLL_ENDED_AUTHOR, {
      excelFile,
      poll,
    });
  }

  async sendEmailVoteReminder(pollId: number) {
    const voteReminderList = await this.usersService.getAllUsersNotVoteByPollId(
      pollId,
    );
    if (voteReminderList.length === 0) return;

    const poll = voteReminderList[0].invitedPolls[0];
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;
    voteReminderList.forEach(
      async (receiver) =>
        await this.sendEmailQueue.add(ProcessorName.VOTE_REMINDER, {
          url,
          receiver,
          poll,
        }),
    );
  }
}
