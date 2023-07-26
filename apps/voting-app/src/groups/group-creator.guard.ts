import {
  MSG_GROUP_NOT_FOUND,
  MSG_GROUP_ID_NOT_EMPTY,
  MSG_USER_NOT_AUTHOR,
} from '../constants/message.constant';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GroupDto } from './dto/group.dto';
import { GroupsService } from './groups.service';

@Injectable()
export class GroupCreatorGuard implements CanActivate {
  constructor(private readonly groupsService: GroupsService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.checkCreator(context);
  }
  async checkCreator(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.params.groupId) {
      throw new BadRequestException(MSG_GROUP_ID_NOT_EMPTY);
    }

    const group: GroupDto = await this.groupsService.findGroupById(
      +request.params.groupId,
    );
    if (!group) {
      throw new NotFoundException(MSG_GROUP_NOT_FOUND);
    }

    if (request.user.id !== group.creatorId) {
      throw new ForbiddenException(MSG_USER_NOT_AUTHOR);
    }

    return true;
  }
}
