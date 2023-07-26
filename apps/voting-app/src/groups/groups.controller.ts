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
    const newGroup = await this.groupsService.createGroup(
      user.id,
      createGroupDto,
    );
    return {
      message: MSG_SUCCESSFUL_GROUP_CREATION,
      data: newGroup,
    };
  }

  @Patch(':groupId')
  @UseGuards(GroupCreatorGuard)
  @UseInterceptors(new TransformDtoInterceptor(GroupDto))
  async updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const updatedGroup = await this.groupsService.updateGroup(
      groupId,
      updateGroupDto,
    );
    return {
      message: MSG_UPDATE_SUCCESSFUL,
      data: updatedGroup,
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
