import {
  MSG_GROUP_NAME_ALREADY_EXISTS,
  MSG_GROUP_NOT_FOUND,
  MSG_SUCCESSFUL_GROUP_CREATION,
  MSG_UPDATE_SUCCESSFUL,
} from './../constants/message.constant';
import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import { JwtAuthGuard } from './../auth/jwt.guard';
import { UserDto } from './../users/dto/user.dto';
import { User } from './../decorators/user.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
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
    try {
      return {
        message: MSG_SUCCESSFUL_GROUP_CREATION,
        data: await this.groupsService.createGroup(user.id, createGroupDto),
      };
    } catch {
      throw new BadRequestException(MSG_GROUP_NAME_ALREADY_EXISTS);
    }
  }

  @Patch()
  @UseGuards(GroupCreatorGuard)
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async updateGroup(@Body() updateGroupDto: UpdateGroupDto) {
    return {
      message: MSG_UPDATE_SUCCESSFUL,
      data: await this.groupsService.updateGroup(updateGroupDto),
    };
  }

  @Get()
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async getGroupList() {
    const groups = await this.groupsService.getGroupList();
    if (groups.length === 0) {
      throw new NotFoundException(MSG_GROUP_NOT_FOUND);
    }
    return {
      data: groups,
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
