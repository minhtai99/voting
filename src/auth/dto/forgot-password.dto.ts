import { OmitType } from '@nestjs/swagger';
import { LoginAuthDto } from './login-auth.dto';

export class ForgotPassDto extends OmitType(LoginAuthDto, [
  'password',
  'isRemember',
]) {}
