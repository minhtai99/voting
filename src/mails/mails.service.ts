import { PollsService } from './../polls/polls.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../users/dto/user.dto';
import { AnswerType } from '@prisma/client';
import { FilesService } from '../files/files.service';
import { PollResultService } from '../poll-result/poll-result.service';
import { SummaryVoteExcel, VoteExcel } from './interfaces/send-mail.interface';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly pollsService: PollsService,
    private readonly filesService: FilesService,
    private readonly pollResultService: PollResultService,
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

  async sendEmailStartedPoll(pollId: number, token: string) {
    const poll = await this.pollsService.findPollById(pollId);
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

  async sendEmailPollEndedParticipants(pollId: number) {
    const pollResult = await this.pollResultService.getPollResultByPollId(
      pollId,
    );

    Promise.all(
      pollResult.poll.votes.map(async (vote) => {
        let participantAnswer: string;
        if (pollResult.poll.answerType !== AnswerType.input) {
          participantAnswer = pollResult.poll.answerOptions
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
          subject: `[Result] ${pollResult.poll.title}`,
          template: './end-poll-participant',
          context: {
            question: pollResult.poll.question,
            receiver:
              vote.participant.firstName + ' ' + vote.participant.lastName,
            author:
              pollResult.poll.author.firstName +
              ' ' +
              pollResult.poll.author.lastName,
            participantAnswer,
            htmlPollResult:
              pollResult.poll.answerType !== AnswerType.input
                ? 'Poll Result:'
                : null,
            pollResult:
              pollResult.answer.length !== 0
                ? pollResult.answer.toString().replace(/,+/g, '\n')
                : null,
          },
        });
      }),
    );
  }

  async sendEmailPollEndedAuthor(pollId: number) {
    const pollResult = await this.pollResultService.getPollResultByPollId(
      pollId,
    );

    const jsonVotes: (VoteExcel | SummaryVoteExcel)[] = [];
    jsonVotes.push({
      title: pollResult.poll.title,
      question: pollResult.poll.question,
      startTime: pollResult.poll.startDate.toLocaleString(),
      endTime: pollResult.poll.endDate.toLocaleString(),
      answerType: pollResult.poll.answerType,
    });
    if (pollResult.poll.answerType === AnswerType.checkbox) {
      pollResult.poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.createdAt.toLocaleString(),
          answer: vote.answers
            .map((answer, index) => `${index + 1}. ${answer.content}`)
            .toString()
            .replace(/,+/g, '\n'),
        });
      });
    } else {
      pollResult.poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.createdAt.toLocaleString(),
          answer: vote.input ?? vote.answers[0].content,
        });
      });
    }

    const excelFile = await this.filesService.convertJsonToExcel(
      `${pollResult.poll.id}_poll_result`,
      jsonVotes,
    );
    await this.mailerService.sendMail({
      to: pollResult.poll.author.email,
      subject: `[Result] ${pollResult.poll.title}`,
      template: './end-poll-author',
      attachments: [
        {
          filename: excelFile.filename,
          content: excelFile.data,
        },
      ],
      context: {
        question: pollResult.poll.question,
        author:
          pollResult.poll.author.firstName +
          ' ' +
          pollResult.poll.author.lastName,
        htmlPollResult:
          pollResult.poll.answerType !== AnswerType.input
            ? 'Poll Result:'
            : null,
        pollResult:
          pollResult.answer.length !== 0
            ? pollResult.answer.toString().replace(/,+/g, '\n')
            : null,
      },
    });
  }
}
