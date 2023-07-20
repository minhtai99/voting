import {
  MSG_POLL_ID_NOT_EMPTY,
  MSG_POLL_NOT_FOUND,
  MSG_USER_NOT_AUTHOR,
} from './../constants/message.constant';
import { PollsService } from './../polls/polls.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PollDto } from './dto/poll.dto';

@Injectable()
export class PollAuthorGuard implements CanActivate {
  constructor(private readonly pollsService: PollsService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.checkAuthor(context);
  }
  async checkAuthor(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.body.pollId || !request.params.pollId) {
      throw new BadRequestException(MSG_POLL_ID_NOT_EMPTY);
    }

    let poll: PollDto;
    if (isNaN(+request.params.pollId) || !request.params.pollId) {
      poll = await this.pollsService.findPollById(+request.body.pollId);
    } else {
      poll = await this.pollsService.findPollById(+request.params.pollId);
    }

    if (!poll) {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }

    if (request.user.id !== poll.authorId) {
      throw new ForbiddenException(MSG_USER_NOT_AUTHOR);
    }

    request['poll'] = poll;
    return true;
  }
}
