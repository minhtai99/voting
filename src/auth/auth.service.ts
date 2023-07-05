import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compareHashedData } from '../helpers/hash.helper';
import { TokenType } from './auth.enum';
import {
  MSG_EMAIL_ALREADY_EXISTS,
  MSG_EMAIL_NOT_EXISTED,
  MSG_ERROR_CREATE_TOKEN,
  MSG_INVALID_REFRESH_TOKEN,
  MSG_INVALID_TOKEN,
  MSG_LOGIN_SUCCESSFUL,
  MSG_LOGOUT_SUCCESSFUL,
  MSG_TOKEN_DOES_NOT_MATCH,
  MSG_PASSWORD_RESET_SUCCESSFUL,
  MSG_REFRESH_TOKEN_SUCCESSFUL,
  MSG_REGISTER_SUCCESSFUL,
  MSG_SENT_MAIL_FORGOT_PASSWORD,
  MSG_USER_NOT_FOUND,
  MSG_WRONG_PASSWORD,
} from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { MailEvent } from '../mails/mails.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResetPassDto } from './dto/reset-password.dto';
import { MailForgotPassPayload } from '../mails/interfaces/send-mail.interface';

interface JwtPayload {
  id: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async register(register: CreateUserDto) {
    const foundUser = await this.usersService.findUserByEmail(register.email);
    if (foundUser) {
      throw new BadRequestException(MSG_EMAIL_ALREADY_EXISTS);
    }

    return {
      message: MSG_REGISTER_SUCCESSFUL,
      user: new UserDto(await this.usersService.createUser(register)),
    };
  }

  async login(loginAuthDto: LoginAuthDto, req: Request) {
    const { email, password, isRemember } = loginAuthDto;
    const foundUser = await this.usersService.findUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException(MSG_EMAIL_NOT_EXISTED);
    }

    const isMatch = await compareHashedData(password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException(MSG_WRONG_PASSWORD);
    }

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };

    const accessToken = this.createJWT(payload, TokenType.ACCESS);
    if (isRemember) {
      const refreshToken = this.createJWT(payload, TokenType.REFRESH);
      await this.usersService.updateRefreshTokenHash(
        foundUser.id,
        refreshToken,
      );
      this.setCookie('RefreshToken', refreshToken, req);
    }

    return {
      message: MSG_LOGIN_SUCCESSFUL,
      AccessToken: accessToken,
      user: new UserDto(foundUser),
    };
  }

  async logout(user: UserDto, req: Request) {
    await this.usersService.updateRefreshTokenHash(user.id);

    req.res.clearCookie('RefreshToken');
    return { message: MSG_LOGOUT_SUCCESSFUL };
  }

  async refreshToken(req: Request) {
    if (!req.cookies.RefreshToken) {
      throw new BadRequestException(MSG_INVALID_REFRESH_TOKEN);
    }
    const refreshToken = req.cookies.RefreshToken;

    const payload = await this.verifyToken(refreshToken, TokenType.REFRESH);

    const foundUser = await this.usersService.findUserByEmail(payload.email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

    const isMatch = await compareHashedData(
      refreshToken.slice(refreshToken.lastIndexOf('.')),
      foundUser.refreshTokenHash,
    );
    if (!isMatch) {
      throw new BadRequestException(MSG_TOKEN_DOES_NOT_MATCH);
    }

    const jwtPayload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const newAccessToken = this.createJWT(jwtPayload, TokenType.ACCESS);
    const newRefreshToken = this.createJWT(jwtPayload, TokenType.REFRESH);

    await this.usersService.updateRefreshTokenHash(
      foundUser.id,
      newRefreshToken,
    );

    this.setCookie('RefreshToken', newRefreshToken, req);
    return {
      message: MSG_REFRESH_TOKEN_SUCCESSFUL,
      AccessToken: newAccessToken,
      user: new UserDto(foundUser),
    };
  }

  async forgotPassword(email: string) {
    const foundUser = await this.usersService.findUserByEmail(email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const resetPassJwt = this.createJWT(payload, TokenType.RESET_PASS);
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
    const payload = await this.verifyToken(token, TokenType.RESET_PASS);

    const foundUser = await this.usersService.findUserByEmail(payload.email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

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

  async verifyToken(token: string, typeToken: TokenType) {
    try {
      return await this.jwtService.verify(token, {
        secret: this.configService.get(`SECRET_${typeToken}_JWT`),
      });
    } catch {
      throw new BadRequestException(MSG_INVALID_TOKEN);
    }
  }

  createJWT(payload: JwtPayload | { pollId: number }, typeToken: TokenType) {
    try {
      if (this.configService.get(`EXPIRE_${typeToken}_JWT`)) {
        return this.jwtService.sign(payload, {
          secret: this.configService.get(`SECRET_${typeToken}_JWT`),
          expiresIn: this.configService.get(`EXPIRE_${typeToken}_JWT`),
        });
      } else {
        return this.jwtService.sign(payload, {
          secret: this.configService.get(`SECRET_${typeToken}_JWT`),
        });
      }
    } catch {
      throw new BadRequestException(MSG_ERROR_CREATE_TOKEN);
    }
  }

  setCookie(key: string, value: string, req: Request) {
    const frontendDomain = this.configService.get('FRONTEND_DOMAIN');
    req.res.cookie(key, value, {
      httpOnly: true,
      domain: frontendDomain,
    });
  }
}
