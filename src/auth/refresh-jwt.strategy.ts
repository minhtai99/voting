import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import {
  MSG_INVALID_TOKEN,
  MSG_REFRESH_TOKEN_DOES_NOT_MATCH,
  MSG_USER_NOT_FOUND,
} from '../constants/message.constant';
import { compareHashedData } from '../helpers/hash.helper';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('SECRET_REFRESH_JWT'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { id: number; email: string }) {
    const [type, refreshToken] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw new UnauthorizedException(MSG_INVALID_TOKEN);
    }

    const user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }

    const isMatch = await compareHashedData(
      refreshToken.slice(refreshToken.lastIndexOf('.')),
      user.refreshTokenHash,
    );
    if (!isMatch) {
      throw new BadRequestException(MSG_REFRESH_TOKEN_DOES_NOT_MATCH);
    }

    return user;
  }
}
