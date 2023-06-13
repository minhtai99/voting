import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { MSG_USER_NOT_FOUND } from 'src/constants/message.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get('SECRET_ACCESS_JWT'),
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && 'AccessToken' in req.cookies) {
      return req.cookies.AccessToken;
    }
    return null;
  }

  async validate(payload: { id: number; email: string }) {
    const user = await this.usersService.foundUserByEmail(payload.email);
    if (!user) {
      throw new NotFoundException(MSG_USER_NOT_FOUND);
    }
    return user;
  }
}
