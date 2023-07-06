import {
  MSG_POLL_STATUS_NOT_ONGOING,
  MSG_TOKEN_DOES_NOT_MATCH,
} from './../constants/message.constant';
import { AuthService } from './../auth/auth.service';
import { PollsService } from './../polls/polls.service';
import { TokenType } from './../auth/auth.enum';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { PollStatus } from '@prisma/client';
import { Observable } from 'rxjs';

@Injectable()
export class VoteTokenGuard implements CanActivate {
  constructor(
    private readonly pollsService: PollsService,
    private readonly authService: AuthService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.validated(context);
  }

  async validated(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const payload = await this.authService.verifyToken(
      request.body.token,
      TokenType.POLL_PERMISSION,
    );
    const poll = await this.pollsService.findPollById(payload.pollId);
    if (poll.token !== request.body.token) {
      throw new BadRequestException(MSG_TOKEN_DOES_NOT_MATCH);
    }
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_NOT_ONGOING);
    }
    request['poll'] = poll;
    return true;
  }
}
