import { UserDto } from '../../users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}

export interface MailInvitationVote {
  pollId: number;
  token: string;
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
