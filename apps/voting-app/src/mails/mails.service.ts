import { PathUrl, createPollToken, getTokenUrl } from '../helpers/token.helper';
import { UsersService } from './../users/users.service';
import { PollsService } from './../polls/polls.service';
import { Injectable } from '@nestjs/common';
import { UserDto } from '../users/dto/user.dto';
import { FilesService } from '../files/files.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ProcessorName } from './mails.enum';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MailsService {
  constructor(
    private readonly pollsService: PollsService,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly jwtService: JwtService,
    @InjectQueue('send-email') private readonly sendEmailQueue: Queue,
  ) {}

  async sendEmailForgotPass(receiver: UserDto, token: string) {
    const url = getTokenUrl(token, PathUrl.FORGOT_PASSWORD);
    await this.sendEmailQueue.add(ProcessorName.FORGOT_PASSWORD, {
      url,
      receiver,
    });
  }

  async sendEmailStartedPoll(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);
    const token = createPollToken(this.jwtService, poll.id);
    const url = getTokenUrl(token, PathUrl.VOTE);
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
    const poll = await this.pollsService.findPollById(pollId);
    const token = createPollToken(this.jwtService, poll.id);
    const url = getTokenUrl(token, PathUrl.VOTE);

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
    const poll = await this.pollsService.findPollById(pollId);

    poll.votes.forEach(async (vote) => {
      await this.sendEmailQueue.add(ProcessorName.POLL_ENDED_PARTICIPANT, {
        vote,
        poll,
      });
    });
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);

    const fileName = await this.filesService.exportDataToFile(pollId);

    await this.sendEmailQueue.add(ProcessorName.POLL_ENDED_AUTHOR, {
      fileName,
      poll,
    });
  }

  async sendEmailVoteReminder(pollId: number) {
    const voteReminderList = await this.usersService.getAllUsersNotVoteByPollId(
      pollId,
    );
    if (voteReminderList.length === 0) return;

    const poll = voteReminderList[0].invitedPolls[0];
    const token = createPollToken(this.jwtService, poll.id);
    const url = getTokenUrl(token, PathUrl.VOTE);
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
