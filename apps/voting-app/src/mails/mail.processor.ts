import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AnswerType } from '@prisma/client';
import { MailClientEvent, ProcessorName } from './mails.enum';
import { ClientProxy } from '@nestjs/microservices';
import { SendMail } from './interfaces/send-mail.interface';

@Processor('send-email')
export class MailProcessor {
  constructor(
    @Inject('MAIL_SERVICE') private readonly mailClient: ClientProxy,
  ) {}
  private readonly logger = new Logger(MailProcessor.name);

  @Process(ProcessorName.FORGOT_PASSWORD)
  async sendEmailForgotPass(job: Job) {
    const { url, receiver } = job.data;
    const payload: SendMail = {
      to: receiver.email,
      subject: 'Reset Your Password',
      context: {
        url,
      },
    };
    this.mailClient.emit(MailClientEvent.SEND_MAIL_FORGOT_PASSWORD, payload);
  }

  @Process(ProcessorName.INVITATION_VOTE)
  async sendEmailInvitationVote(job: Job) {
    const { url, receiver, poll } = job.data;
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

    const payload: SendMail = {
      to: vote.participant.email,
      subject: `[Result] ${poll.title}`,
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
    };
    this.mailClient.emit(
      MailClientEvent.SEND_MAIL_POLL_ENDED_PARTICIPANT,
      payload,
    );
  }

  @Process(ProcessorName.POLL_ENDED_AUTHOR)
  async sendEmailPollEndedAuthor(job: Job) {
    const { fileName, poll } = job.data;
    const payload: SendMail = {
      to: poll.author.email,
      subject: `[Result] ${poll.title}`,
      pathFile: `./dist/${fileName}`,
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

  @Process(ProcessorName.VOTE_REMINDER)
  async sendEmailVoteReminder(job: Job) {
    const { url, receiver, poll } = job.data;
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
  }

  @OnQueueFailed()
  async onFailed(job: Job, err: Error) {
    this.logger.error(err);
  }
}
