import { UserDto } from 'src/users/dto/user.dto';

export interface MailForgotPassPayload {
  receiver: UserDto;
  token: string;
}
