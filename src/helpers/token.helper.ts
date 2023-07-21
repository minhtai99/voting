import { BadRequestException } from '@nestjs/common';
import {
  MSG_ERROR_CREATE_TOKEN,
  MSG_INVALID_TOKEN,
} from './../constants/message.constant';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const configService = new ConfigService();
const jwtService = new JwtService();

export interface JwtPayload {
  id?: number;
  email?: string;
  pollId?: number;
}

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  RESET_PASS = 'RESET_PASS',
  POLL_PERMISSION = 'POLL_PERMISSION',
}

export enum PathUrl {
  VOTE = 'vote',
  FORGOT_PASSWORD = 'auth/reset-password',
}

export const getTokenUrl = (token: string, path: PathUrl) => {
  return `${process.env.FRONTEND_URL}/${path}?token=${token}`;
};

export const createPollToken = (pollId: number) => {
  return createJWT({ pollId }, TokenType.POLL_PERMISSION);
};

export const createJWT = (payload: JwtPayload, typeToken: TokenType) => {
  try {
    if (configService.get(`EXPIRE_${typeToken}_JWT`)) {
      return jwtService.sign(payload, {
        secret: configService.get(`SECRET_${typeToken}_JWT`),
        expiresIn: configService.get(`EXPIRE_${typeToken}_JWT`),
      });
    } else {
      return jwtService.sign(payload, {
        secret: configService.get(`SECRET_${typeToken}_JWT`),
      });
    }
  } catch {
    throw new BadRequestException(MSG_ERROR_CREATE_TOKEN);
  }
};

export const verifyToken = async (token: string, typeToken: TokenType) => {
  try {
    return await jwtService.verify(token, {
      secret: configService.get(`SECRET_${typeToken}_JWT`),
    });
  } catch {
    throw new BadRequestException(MSG_INVALID_TOKEN);
  }
};
