import { CreateUserDto } from 'src/users/dto/create-user.dto';
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
import { compareHashedData } from 'src/helpers/hash.helper';
import { TokenType } from './auth.enum';
import {
  MSG_EMAIL_ALREADY_EXISTS,
  MSG_EMAIL_NOT_EXISTED,
  MSG_INVALID_REFRESH_TOKEN,
  MSG_INVALID_TOKEN,
  MSG_LOGIN_SUCCESSFUL,
  MSG_LOGOUT_SUCCESSFUL,
  MSG_PASSWORD_RESET_SUCCESSFUL,
  MSG_REFRESH_TOKEN_SUCCESSFUL,
  MSG_REGISTER_SUCCESSFUL,
  MSG_SENT_MAIL_FORGOT_PASSWORD,
  MSG_USER_NOT_FOUND,
} from 'src/constants/message.constant';
import { UserDto } from 'src/users/dto/user.dto';
import { MailEvent } from 'src/mails/mails.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResetPassDto } from './dto/reset-password.dto';

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
    const foundUser = await this.usersService.foundUserByEmail(register.email);
    if (foundUser) {
      throw new BadRequestException(MSG_EMAIL_ALREADY_EXISTS);
    }

    return {
      message: MSG_REGISTER_SUCCESSFUL,
      data: await this.usersService.create(register),
    };
  }

  async login(loginAuthDto: LoginAuthDto, req: Request) {
    const { email, password, isRemember } = loginAuthDto;
    const foundUser = await this.usersService.foundUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException(MSG_EMAIL_NOT_EXISTED);
    }

    await compareHashedData(password, foundUser.password);

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };

    const accessToken = await this.createJWT(payload, TokenType.ACCESS);
    if (isRemember) {
      const refreshToken = await this.createJWT(payload, TokenType.REFRESH);
      await this.usersService.updateRefreshToken(foundUser.id, refreshToken);
      this.setCookie('RefreshToken', refreshToken, req);
    }

    return {
      message: MSG_LOGIN_SUCCESSFUL,
      AccessToken: accessToken,
      user: foundUser,
    };
  }

  async logout(user: UserDto, req: Request) {
    await this.usersService.updateRefreshToken(user.id);

    req.res.clearCookie('AccessToken');
    req.res.clearCookie('RefreshToken');
    return { message: MSG_LOGOUT_SUCCESSFUL };
  }

  async refreshToken(req: Request) {
    if (!req.cookies.RefreshToken) {
      throw new BadRequestException(MSG_INVALID_REFRESH_TOKEN);
    }
    const refreshToken = req.cookies.RefreshToken;

    const payload = await this.verifyToken(refreshToken, TokenType.REFRESH);

    const foundUser = await this.usersService.foundUserByEmail(payload.email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

    await compareHashedData(refreshToken, foundUser.refreshTokenHash);

    const jwtPayload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const newAccessToken = await this.createJWT(jwtPayload, TokenType.ACCESS);
    const newRefreshToken = await this.createJWT(payload, TokenType.REFRESH);

    await this.usersService.updateRefreshToken(foundUser.id, newRefreshToken);

    this.setCookie('RefreshToken', newRefreshToken, req);
    return {
      message: MSG_REFRESH_TOKEN_SUCCESSFUL,
      AccessToken: newAccessToken,
      user: foundUser,
    };
  }

  async forgotPassword(email: string) {
    const foundUser = await this.usersService.foundUserByEmail(email);

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };
    const resetPassJwt = await this.createJWT(payload, TokenType.RESET_PASS);
    await this.usersService.updateResetPasswordHash(foundUser.id, resetPassJwt);

    this.eventEmitter.emit(MailEvent.SEND_MAIL_FORGOT_PASSWORD, {
      receiver: foundUser,
      token: resetPassJwt,
    });

    return { message: MSG_SENT_MAIL_FORGOT_PASSWORD };
  }

  async resetPassword(body: ResetPassDto) {
    const { newPassword, token } = body;
    const payload = await this.verifyToken(token, TokenType.RESET_PASS);

    const foundUser = await this.usersService.foundUserByEmail(payload.email);
    if (!foundUser) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

    await compareHashedData(token, foundUser.resetPasswordHash);

    await this.usersService.resetPassword(foundUser.id, newPassword);
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

  async createJWT(payload: JwtPayload, typeToken: TokenType) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get(`SECRET_${typeToken}_JWT`),
      expiresIn: this.configService.get(`EXPIRE_${typeToken}_JWT`),
    });
  }

  setCookie(key: string, value: string, req: Request) {
    const frontendDomain = this.configService.get('FRONTEND_DOMAIN');
    req.res.cookie(key, value, {
      httpOnly: true,
      domain: frontendDomain,
    });
  }
}
