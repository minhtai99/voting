import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compareHashedData } from '../helpers/hash.helper';
import {
  MSG_EMAIL_ALREADY_EXISTS,
  MSG_INVALID_TOKEN,
  MSG_LOGIN_SUCCESSFUL,
  MSG_LOGOUT_SUCCESSFUL,
  MSG_TOKEN_DOES_NOT_MATCH,
  MSG_PASSWORD_RESET_SUCCESSFUL,
  MSG_REFRESH_TOKEN_SUCCESSFUL,
  MSG_REGISTER_SUCCESSFUL,
  MSG_SENT_MAIL_FORGOT_PASSWORD,
  MSG_USER_NOT_FOUND,
  MSG_WRONG_LOGIN_INFORMATION,
  MSG_REFRESH_TOKEN_DOES_NOT_MATCH,
} from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { MailEvent } from '../mails/mails.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResetPassDto } from './dto/reset-password.dto';
import { MailForgotPassPayload } from '../mails/interfaces/send-mail.interface';
import { Request } from 'express';
import {
  JwtPayload,
  TokenType,
  createJWT,
  verifyToken,
} from './../helpers/token.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async register(register: CreateUserDto) {
    const foundUser = await this.usersService.findUserByEmail(register.email);
    if (foundUser) {
      throw new BadRequestException(MSG_EMAIL_ALREADY_EXISTS);
    }

    return {
      message: MSG_REGISTER_SUCCESSFUL,
      data: await this.usersService.createUser(register),
    };
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password, isRemember } = loginAuthDto;
    const foundUser: UserDto = await this.usersService.findUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException(MSG_WRONG_LOGIN_INFORMATION);
    }

    const isMatch = await compareHashedData(password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException(MSG_WRONG_LOGIN_INFORMATION);
    }

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };

    const accessToken = createJWT(payload, TokenType.ACCESS);
    let refreshToken: string = null;
    if (isRemember) {
      refreshToken = createJWT(payload, TokenType.REFRESH);
      await this.usersService.updateRefreshTokenHash(
        foundUser.id,
        refreshToken,
      );
    }

    return {
      message: MSG_LOGIN_SUCCESSFUL,
      accessToken: accessToken,
      refreshToken: refreshToken,
      data: foundUser,
    };
  }

  async logout(user: UserDto) {
    await this.usersService.updateRefreshTokenHash(user.id);

    return { message: MSG_LOGOUT_SUCCESSFUL };
  }

  async refreshToken(req: Request) {
    const [type, refreshToken] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw new UnauthorizedException(MSG_INVALID_TOKEN);
    }

    const payload = await verifyToken(refreshToken, TokenType.REFRESH);

    const foundUser = await this.getUser(payload.email);

    const isMatch = await compareHashedData(
      refreshToken.slice(refreshToken.lastIndexOf('.')),
      foundUser.refreshTokenHash,
    );
    if (!isMatch) {
      throw new BadRequestException(MSG_REFRESH_TOKEN_DOES_NOT_MATCH);
    }

    const jwtPayload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const newAccessToken = createJWT(jwtPayload, TokenType.ACCESS);
    const newRefreshToken = createJWT(jwtPayload, TokenType.REFRESH);

    await this.usersService.updateRefreshTokenHash(
      foundUser.id,
      newRefreshToken,
    );

    return {
      message: MSG_REFRESH_TOKEN_SUCCESSFUL,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const foundUser = await this.getUser(email);

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const resetPassJwt = createJWT(payload, TokenType.RESET_PASS);
    await this.usersService.updateResetPasswordHash(foundUser.id, resetPassJwt);
    const forgotPassPayload: MailForgotPassPayload = {
      receiver: foundUser,
      token: resetPassJwt,
    };
    this.eventEmitter.emit(
      MailEvent.SEND_MAIL_FORGOT_PASSWORD,
      forgotPassPayload,
    );

    return { message: MSG_SENT_MAIL_FORGOT_PASSWORD };
  }

  async resetPassword(resetPassDto: ResetPassDto) {
    const { newPassword, token } = resetPassDto;
    const payload = await verifyToken(token, TokenType.RESET_PASS);

    const foundUser = await this.getUser(payload.email);

    const isMatch = await compareHashedData(
      token.slice(token.lastIndexOf('.')),
      foundUser.resetPasswordHash,
    );
    if (!isMatch) {
      throw new BadRequestException(MSG_TOKEN_DOES_NOT_MATCH);
    }

    await this.usersService.updatePassword(foundUser.id, newPassword);
    return { message: MSG_PASSWORD_RESET_SUCCESSFUL };
  }

  async getUser(email: string) {
    const foundUser: UserDto = await this.usersService.findUserByEmail(email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }
    return foundUser;
  }

  // setCookie(key: string, value: string, req: Request) {
  //   const frontendDomain = this.configService.get('FRONTEND_DOMAIN');
  //   req.res.cookie(key, value, {
  //     httpOnly: true,
  //     domain: frontendDomain,
  //   });
  // }
}
