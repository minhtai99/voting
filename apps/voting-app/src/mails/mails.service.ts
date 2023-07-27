import { PathUrl, createPollToken, getTokenUrl } from '../helpers/token.helper';
import { UsersService } from './../users/users.service';
import { PollsService } from './../polls/polls.service';
import { Inject, Injectable } from '@nestjs/common';
import { UserDto } from '../users/dto/user.dto';
import { FilesService } from '../files/files.service';
import { MailClientEvent } from './mails.enum';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { MailInvitationVote, SendMail } from './interfaces/send-mail.interface';
import { AnswerType } from '@prisma/client';
import { join } from 'path';

@Injectable()
export class MailsService {
  constructor(
    private readonly pollsService: PollsService,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly jwtService: JwtService,
    @Inject('MAIL_SERVICE') private readonly mailClient: ClientProxy,
  ) {}

  async sendEmailForgotPass(receiver: UserDto, token: string) {
    const url = getTokenUrl(token, PathUrl.FORGOT_PASSWORD);
    const payload: SendMail = {
      to: receiver.email,
      subject: 'Reset Your Password',
      context: {
        url,
      },
    };
    this.mailClient.emit(MailClientEvent.SEND_MAIL_FORGOT_PASSWORD, payload);
  }

  async sendEmailInvitePeople(payload: MailInvitationVote) {
    const poll = await this.pollsService.findPollById(payload.pollId);
    const token = createPollToken(this.jwtService, poll.id);
    const url = getTokenUrl(token, PathUrl.VOTE);
    let invitationList = poll.invitedUsers;
    if (payload.newInvitedUsers) {
      invitationList = invitationList.filter((user) =>
        payload.newInvitedUsers.find((userId) => userId === user.id),
      );
    }

    invitationList.forEach(async (receiver) => {
      const payload: SendMail = {
        to: receiver.email,
        subject: `[Invitation] ${poll.title}`,
        context: {
          url,
          receiver: receiver.firstName + ' ' + receiver.lastName,
          author: poll.author.firstName + ' ' + poll.author.lastName,
          question: poll.question,
          endTime: poll.endDate,
        },
      };
      this.mailClient.emit(MailClientEvent.SEND_MAIL_INVITATION_VOTE, payload);
    });
  }

  async sendEmailPollEndedParticipants(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);

    poll.votes.forEach(async (vote) => {
      let participantAnswer: string[] | string;
      if (poll.answerType === AnswerType.checkbox) {
        participantAnswer = vote.answers.map((answerOption) => {
          return answerOption.content;
        });
      } else {
        participantAnswer = vote.input ?? vote.answers[0].content;
      }

      const payload: SendMail = {
        to: vote.participant.email,
        subject: `[Result] ${poll.title}`,
        context: {
          question: poll.question,
          receiver:
            vote.participant.firstName + ' ' + vote.participant.lastName,
          author: poll.author.firstName + ' ' + poll.author.lastName,
          isArrayAnswer: poll.answerType === AnswerType.checkbox ? true : false,
          participantAnswer,
          isPollResult: poll.answerType === AnswerType.input ? false : true,
          answerOptions: poll.answerOptions.sort(
            (a: any, b: any) => b._count.votes - a._count.votes,
          ),
        },
      };
      this.mailClient.emit(
        MailClientEvent.SEND_MAIL_POLL_ENDED_PARTICIPANT,
        payload,
      );
    });
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);

    const fileName = await this.filesService.exportDataToFile(pollId);

    const payload: SendMail = {
      to: poll.author.email,
      subject: `[Result] ${poll.title}`,
      attachments: [
        {
          filename: fileName,
          path: join(__dirname, '../../', fileName),
        },
      ],
      context: {
        question: poll.question,
        author: poll.author.firstName + ' ' + poll.author.lastName,
        isPollResult: poll.answerType === AnswerType.input ? false : true,
        answerOptions: poll.answerOptions.sort(
          (a: any, b: any) => b._count.votes - a._count.votes,
        ),
      },
    };
    this.mailClient.emit(MailClientEvent.SEND_MAIL_POLL_ENDED_AUTHOR, payload);
  }

  async sendEmailVoteReminder(pollId: number) {
    const voteReminderList = await this.usersService.getAllUsersNotVoteByPollId(
      pollId,
    );
    if (voteReminderList.length === 0) return;

    const poll = voteReminderList[0].invitedPolls[0];
    const token = createPollToken(this.jwtService, poll.id);
    const url = getTokenUrl(token, PathUrl.VOTE);
    voteReminderList.forEach(async (receiver) => {
      const payload: SendMail = {
        to: receiver.email,
        subject: `[Reminder] ${poll.title}`,
        context: {
          url,
          receiver: receiver.firstName + ' ' + receiver.lastName,
          author: poll.author.firstName + ' ' + poll.author.lastName,
          question: poll.question,
          endTime: poll.endDate,
        },
      };
      this.mailClient.emit(MailClientEvent.SEND_MAIL_VOTE_REMINDER, payload);
    });
  }
}
