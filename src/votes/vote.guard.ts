import { MSG_TOKEN_DOES_NOT_MATCH } from './../constants/message.constant';
import { AuthService } from './../auth/auth.service';
import { PollsService } from './../polls/polls.service';
import { TokenType } from './../auth/auth.enum';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PollDto } from 'src/polls/dto/poll.dto';

@Injectable()
export class VoteGuard implements CanActivate {
  constructor(
    private readonly pollsService: PollsService,
    private readonly authService: AuthService,
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
    const payload = await this.authService.verifyToken(
      request.body.token,
      TokenType.POLL_PERMISSION,
    );
    const poll = await this.pollsService.findPollById(payload.pollId);
    if (poll.token !== request.body.token) {
      throw new BadRequestException(MSG_TOKEN_DOES_NOT_MATCH);
    }

    request['poll'] = poll;
    return this.checkInvited(context);
  }

  async checkInvited(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    let poll: PollDto;
    if (request.params.pollId) {
      poll = await this.pollsService.findPollById(+request.params.pollId);
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
