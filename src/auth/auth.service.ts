import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from './../users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compareHashedData } from 'src/helpers/hash.helper';
import { TokenType } from './auth.enum';

type JwtPayload = {
  sub: number;
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
      throw new BadRequestException('Email is already registered');
    }

    return {
      message: 'Account created successfully!',
      data: await this.usersService.create(register),
    };
  }

  async login(loginAuthDto: LoginAuthDto, req: Request) {
    const { email, password, isRemember } = loginAuthDto;
    const foundUser = await this.usersService.foundUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException('Email not existed');
    }

    const isMatch = await compareHashedData(password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException('Your email/password is incorrect');
    }

    const payload: JwtPayload = {
      sub: foundUser.id,
      email: foundUser.email,
    };

    const accessToken = await this.createJWT(payload, TokenType.ACCESS);
    this.setCookie('accessToken', accessToken, req);

    if (isRemember) {
      const refreshToken = await this.createJWT(payload, TokenType.REFRESH);
      await this.usersService.updateRefreshToken(foundUser.id, refreshToken);

      this.setCookie('refreshToken', refreshToken, req);
      return {
        message: 'Logged in successfully',
        accessToken,
        refreshToken,
      };
    }

    return {
      message: 'Logged in successfully',
      accessToken,
    };
  }

  async createJWT(payload: JwtPayload, typeToken: TokenType) {
    if (typeToken === 'ACCESS') {
      return this.jwtService.signAsync(payload, {
        secret: this.configService.get('SECRET_ACCESS_JWT'),
        expiresIn: this.configService.get('EXPIRE_ACCESS_JWT'),
      });
    }
    if (typeToken === 'REFRESH') {
      return this.jwtService.signAsync(payload, {
        secret: this.configService.get('SECRET_REFRESH_JWT'),
        expiresIn: this.configService.get('EXPIRE_REFRESH_JWT'),
      });
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
