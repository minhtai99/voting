import Mail from 'nodemailer/lib/mailer';
import { UserDto } from '../../users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}

export interface MailInvitationVote {
  pollId: number;
  newInvitedUsers?: number[];
}

export interface VoteExcel {
  email: string;
  name: string;
  time: string;
  answer: string;
}

export interface SummaryVoteExcel {
  title: string;
  question: string;
  startTime: string;
  endTime: string;
  answerType: string;
}

export interface SendMail {
  to: string;
  subject: string;
  context: object;
  attachments?: Mail.Attachment[];
}
