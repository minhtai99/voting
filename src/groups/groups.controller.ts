import {
  MSG_SUCCESSFUL_GROUP_CREATION,
  MSG_UPDATE_SUCCESSFUL,
} from './../constants/message.constant';
import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import { JwtAuthGuard } from './../auth/jwt.guard';
import { UserDto } from './../users/dto/user.dto';
import { User } from './../decorators/user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDto } from './dto/group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupCreatorGuard } from './group-creator.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async createGroup(
    @User() user: UserDto,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return {
      data: await this.groupsService.createGroup(user.id, createGroupDto),
      message: MSG_SUCCESSFUL_GROUP_CREATION,
    };
  }

  @Patch()
  @UseGuards(GroupCreatorGuard)
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async updateGroup(@Body() updateGroupDto: UpdateGroupDto) {
    return {
      data: await this.groupsService.updateGroup(updateGroupDto),
      message: MSG_UPDATE_SUCCESSFUL,
    };
  }

  @Get()
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async getGroupList() {
    return {
      data: await this.groupsService.getGroupList(),
    };
  }

  @Delete(':groupId')
  @UseGuards(GroupCreatorGuard)
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async deleteGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    try {
      return await this.groupsService.deleteGroup(groupId);
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }
}
