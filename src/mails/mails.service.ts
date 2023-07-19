import { UsersService } from './../users/users.service';
import { PollDto } from 'src/polls/dto/poll.dto';
import { PollsService } from './../polls/polls.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';
import { AnswerType } from '@prisma/client';
import { FilesService } from '../files/files.service';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
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
    const poll: PollDto = await this.pollsService.findPollById(pollId);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;
    Promise.all(
      poll.invitedUsers.map(
        async (receiver) =>
          await this.mailerService.sendMail({
            to: receiver.email,
            subject: `[Invitation] ${poll.title}`,
            template: './invitation-vote',
            context: {
              url,
              receiver: receiver.firstName + ' ' + receiver.lastName,
              author: poll.author.firstName + ' ' + poll.author.lastName,
              question: poll.question,
              endTime: poll.endDate,
            },
          }),
      ),
    );
  }

  async sendEmailInvitePeople(pollId: number, newInvitedUsers: number[]) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;

    Promise.all(
      poll.invitedUsers.map(async (receiver) => {
        if (newInvitedUsers.some((userId) => userId === receiver.id)) {
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
          });
        }
      }),
    );
  }

  async sendEmailPollEndedParticipants(pollId: number) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);

    Promise.all(
      poll.votes.map(async (vote) => {
        let participantAnswer: string[] | string;
        if (poll.answerType === AnswerType.checkbox) {
          participantAnswer = vote.answers.map((answerOption) => {
            return answerOption.content;
          });
        } else {
          participantAnswer = vote.input ?? vote.answers[0].content;
        }

        await this.mailerService.sendMail({
          to: vote.participant.email,
          subject: `[Result] ${poll.title}`,
          template: './end-poll-participant',
          context: {
            question: poll.question,
            receiver:
              vote.participant.firstName + ' ' + vote.participant.lastName,
            author: poll.author.firstName + ' ' + poll.author.lastName,
            isArrayAnswer:
              poll.answerType === AnswerType.checkbox ? true : false,
            participantAnswer,
            isPollResult: poll.answerType === AnswerType.input ? false : true,
            answerOptions: poll.answerOptions.sort(
              (a: any, b: any) => b._count.votes - a._count.votes,
            ),
          },
        });
      }),
    );
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const poll: PollDto = await this.pollsService.findPollById(pollId);

    const excelFile = await this.filesService.exportDataToBuffer(pollId);

    await this.mailerService.sendMail({
      to: poll.author.email,
      subject: `[Result] ${poll.title}`,
      template: './end-poll-author',
      attachments: [
        {
          filename: excelFile.filename,
          content: excelFile.data,
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
    Promise.all(
      voteReminderList.map(
        async (receiver) =>
          await this.mailerService.sendMail({
            to: receiver.email,
            subject: `[Reminder] ${poll.title}`,
            template: './vote-reminder',
            context: {
              url,
              receiver: receiver.firstName + ' ' + receiver.lastName,
              author: poll.author.firstName + ' ' + poll.author.lastName,
              question: poll.question,
              endTime: poll.endDate,
            },
          }),
      ),
    );
  }
}
