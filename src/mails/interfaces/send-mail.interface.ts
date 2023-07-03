import { UserDto } from '../../users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}

export interface MailInvitationVotePayload extends MailPollPayload {
  invitedUsers: UserDto[];
}

export interface MailPollPayload {
  inviter?: UserDto;
  pollId: number;
  receiver?: UserDto;
}
