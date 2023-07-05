import { MSG_USER_NOT_AUTHOR } from './../constants/message.constant';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { VotesService } from './votes.service';

@Injectable()
export class IsAuthorGuard implements CanActivate {
  constructor(private readonly votesService: VotesService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;
    const vote = await this.votesService.findVoteById(body.voteId);
    if (user.id !== vote.participantId) {
      throw new ForbiddenException(MSG_USER_NOT_AUTHOR);
    }
    return true;
  }
}
