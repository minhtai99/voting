import { UserDto } from '../../users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}

export interface MailInvitationVote {
  pollId: number;
  token: string;
}
