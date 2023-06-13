import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from './../users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compareData } from 'src/helpers/compare.helper';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

type JwtPayload = {
  sub: number;
  email: string;
};

type TypeToken = 'ACCESS' | 'REFRESH' | 'RESET_PASS';

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

  async login(loginAuthDto: LoginAuthDto, res: Response) {
    const { email, password, isRemember } = loginAuthDto;
    const foundUser = await this.usersService.foundUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException('Your email/password is incorrect');
    }

    const isMatch = await compareData(password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException('Your email/password is incorrect');
    }

    const payload: JwtPayload = {
      sub: foundUser.id,
      email: foundUser.email,
    };

    const access_token = await this.createJWT(payload, 'ACCESS');
    this.setCookie('access_token', access_token, res);

    if (isRemember) {
      const refresh_token = await this.createJWT(payload, 'REFRESH');
      await this.usersService.updateRefreshToken(foundUser.id, refresh_token);

      this.setCookie('refresh_token', refresh_token, res);
      return res.send({
        message: 'Logged in successfully',
        access_token,
        refresh_token,
      });
    }

    return res.send({
      message: 'Logged in successfully',
      access_token,
    });
  }

  async createJWT(payload: JwtPayload, typeToken: TypeToken) {
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

  setCookie(key: string, value: string, res: Response) {
    const frontendDomain = this.configService.get('FRONTEND_DOMAIN');
    res.cookie(key, value, {
      httpOnly: true,
      domain: frontendDomain,
    });
  }
}
