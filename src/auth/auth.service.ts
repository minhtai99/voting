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
  MSG_LOGIN_SUCCESSFUL,
  MSG_LOGOUT_SUCCESSFUL,
  MSG_REFRESH_TOKEN_SUCCESSFUL,
  MSG_REGISTER_SUCCESSFUL,
  MSG_USER_NOT_FOUND,
  MSG_WRONG_PASSWORD,
} from 'src/constants/message.constant';
import { UserDto } from 'src/users/dto/user.dto';

type JwtPayload = {
  id: number;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    const isMatch = await compareHashedData(password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException(MSG_WRONG_PASSWORD);
    }

    const payload: JwtPayload = {
      id: foundUser.id,
      email: foundUser.email,
    };

    const accessToken = await this.createJWT(payload, TokenType.ACCESS);
    this.setCookie('AccessToken', accessToken, req);

    if (isRemember) {
      const refreshToken = await this.createJWT(payload, TokenType.REFRESH);
      await this.usersService.updateRefreshToken(foundUser.id, refreshToken);

      this.setCookie('RefreshToken', refreshToken, req);
      return {
        message: MSG_LOGIN_SUCCESSFUL,
        accessToken,
        refreshToken,
      };
    }

    return {
      message: MSG_LOGIN_SUCCESSFUL,
      accessToken,
    };
  }

  async logout(user: UserDto, req: Request) {
    await this.usersService.updateRefreshToken(user.id);

    req.res.clearCookie('AccessToken');
    req.res.clearCookie('RefreshToken');
    return { message: MSG_LOGOUT_SUCCESSFUL };
  }

  async refreshToken(req: Request) {
    if (req.cookies && 'RefreshToken' in req.cookies) {
      const refreshToken = req.cookies.RefreshToken;
      const user = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get('SECRET_REFRESH_JWT'),
      });

      const foundUser = await this.usersService.foundUserByEmail(user.email);
      if (!foundUser) {
        throw new NotFoundException(MSG_USER_NOT_FOUND);
      }

      const isMatch = await compareHashedData(
        refreshToken,
        foundUser.refreshTokenHash,
      );
      if (!isMatch) {
        throw new BadRequestException(MSG_INVALID_REFRESH_TOKEN);
      }

      const payload: JwtPayload = {
        id: foundUser.id,
        email: foundUser.email,
      };
      const newAccessToken = await this.createJWT(payload, TokenType.ACCESS);
      const newRefreshToken = await this.createJWT(payload, TokenType.REFRESH);

      await this.usersService.updateRefreshToken(foundUser.id, newRefreshToken);

      this.setCookie('AccessToken', newAccessToken, req);
      this.setCookie('RefreshToken', newRefreshToken, req);
      return {
        message: MSG_REFRESH_TOKEN_SUCCESSFUL,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } else {
      throw new BadRequestException(MSG_INVALID_REFRESH_TOKEN);
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
