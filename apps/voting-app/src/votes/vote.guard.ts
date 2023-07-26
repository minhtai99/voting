import { MSG_POLL_NOT_FOUND } from './../constants/message.constant';
import { PollsService } from './../polls/polls.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenType, verifyToken } from './../helpers/token.helper';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class VoteGuard implements CanActivate {
  constructor(
    private readonly pollsService: PollsService,
    private readonly jwtService: JwtService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.body.token) {
      return this.validated(context);
    }
    if (request.params.pollId) {
      return this.checkInvited(context);
    }
  }

  async validated(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const payload = await verifyToken(
      this.jwtService,
      request.body.token,
      TokenType.POLL_PERMISSION,
    );
    const poll = await this.pollsService.findPollById(payload.pollId);
    if (!poll) {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }

    request['poll'] = poll;
    return this.checkInvited(context);
  }

  async checkInvited(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    let poll;
    if (request.params.pollId) {
      poll = await this.pollsService.findPollById(+request.params.pollId);
      if (!poll) {
        throw new NotFoundException(MSG_POLL_NOT_FOUND);
      }
      request['poll'] = poll;
    } else {
      poll = request['poll'];
    }

    const invited = poll.invitedUsers.some(
      (invitedUser) => request.user.id === invitedUser.id,
    );
    if (!invited && request.user.id !== poll.authorId) {
      throw new ForbiddenException();
    }

    return true;
  }
}
