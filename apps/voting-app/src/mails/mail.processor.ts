import { MailerService } from '@nestjs-modules/mailer';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AnswerType } from '@prisma/client';
import { ProcessorName } from './mails.enum';

@Processor('send-email')
export class MailProcessor {
  constructor(private readonly mailerService: MailerService) {}
  private readonly logger = new Logger(MailProcessor.name);

  @Process(ProcessorName.FORGOT_PASSWORD)
  async sendEmailForgotPass(job: Job) {
    const { url, receiver } = job.data;
    await this.mailerService.sendMail({
      to: receiver.email,
      subject: 'Reset Your Password',
      template: './forgot-password',
      context: {
        url,
      },
    });
  }

  @Process(ProcessorName.INVITATION_VOTE)
  async sendEmailInvitationVote(job: Job) {
    const { url, receiver, poll } = job.data;
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
    });
  }

  @Process(ProcessorName.POLL_ENDED_PARTICIPANT)
  async sendEmailPollEndedParticipants(job: Job) {
    const { vote, poll } = job.data;
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
        receiver: vote.participant.firstName + ' ' + vote.participant.lastName,
        author: poll.author.firstName + ' ' + poll.author.lastName,
        isArrayAnswer: poll.answerType === AnswerType.checkbox ? true : false,
        participantAnswer,
        isPollResult: poll.answerType === AnswerType.input ? false : true,
        answerOptions: poll.answerOptions.sort(
          (a: any, b: any) => b._count.votes - a._count.votes,
        ),
      },
    });
  }

  @Process(ProcessorName.POLL_ENDED_AUTHOR)
  async sendEmailPollEndedAuthor(job: Job) {
    const { excelFile, poll } = job.data;
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

  @Process(ProcessorName.VOTE_REMINDER)
  async sendEmailVoteReminder(job: Job) {
    const { url, receiver, poll } = job.data;
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
    });
  }

  @OnQueueFailed()
  async onFailed(job: Job, err: Error) {
    this.logger.error(err);
  }
}
