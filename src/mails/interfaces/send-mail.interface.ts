import { UserDto } from '../../users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}
