import { PollsService } from './../polls/polls.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';
import { AnswerType } from '@prisma/client';
import { FilesService } from '../files/files.service';
import { SummaryVoteExcel, VoteExcel } from './interfaces/send-mail.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
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
              author: poll.author.firstName + ' ' + poll.author.lastName,
              question: poll.question,
              endTime: poll.endDate,
            },
          }),
      ),
    );
  }

  async sendEmailInvitePeople(pollId: number, newInvitedUsers: number[]) {
    const poll = await this.pollsService.findPollById(pollId);
    const url = `${this.configService.get('FRONTEND_URL')}/vote?token=${
      poll.token
    }`;

    Promise.all(
      newInvitedUsers.map(async (userId) => {
        const receiver = await this.usersService.findUserById(userId);
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
      }),
    );
  }

  async sendEmailPollEndedParticipants(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);
    const pollResult: string[] = [];
    poll.answerOptions.sort((a, b) => b._count.votes - a._count.votes);
    for (const answerOption of poll.answerOptions) {
      pollResult.push(
        `${answerOption.content} - ${answerOption._count.votes} votes`,
      );
    }

    Promise.all(
      poll.votes.map(async (vote) => {
        let participantAnswer: string;
        if (poll.answerType !== AnswerType.input) {
          participantAnswer = poll.answerOptions
            .map((answerOption) => {
              return answerOption.content;
            })
            .toString()
            .replace(/,+/g, ', ');
        } else {
          participantAnswer = vote.input;
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
            participantAnswer,
            htmlPollResult:
              poll.answerType !== AnswerType.input ? 'Poll Result:' : null,
            pollResult:
              pollResult.length !== 0
                ? pollResult.toString().replace(/,+/g, '\n')
                : null,
          },
        });
      }),
    );
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);
    const pollResult: string[] = [];
    poll.answerOptions.sort((a, b) => b._count.votes - a._count.votes);
    for (const answerOption of poll.answerOptions) {
      pollResult.push(
        `${answerOption.content} - ${answerOption._count.votes} votes`,
      );
    }

    const jsonVotes: (VoteExcel | SummaryVoteExcel)[] = [];
    jsonVotes.push({
      title: poll.title,
      question: poll.question,
      startTime: poll.startDate.toLocaleString(),
      endTime: poll.endDate.toLocaleString(),
      answerType: poll.answerType,
    });
    if (poll.answerType === AnswerType.checkbox) {
      poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.updatedAt.toLocaleString(),
          answer: vote.answers
            .map((answer, index) => `${index + 1}. ${answer.content}`)
            .toString()
            .replace(/,+/g, '\n'),
        });
      });
    } else {
      poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.updatedAt.toLocaleString(),
          answer:
            poll.answerType === AnswerType.input
              ? vote.input
              : vote.answers[0].content,
        });
      });
    }

    const excelFile = await this.filesService.convertJsonToExcel(
      `${poll.id}_poll_result`,
      jsonVotes,
    );

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
        htmlPollResult:
          poll.answerType !== AnswerType.input ? 'Poll Result:' : null,
        pollResult:
          pollResult.length !== 0
            ? pollResult.toString().replace(/,+/g, '\n')
            : null,
      },
    });
  }
}
