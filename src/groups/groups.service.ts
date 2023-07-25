import { MSG_DELETE_GROUP_SUCCESSFUL } from './../constants/message.constant';
import { CrudService } from './../crud/crud.service';
import { GROUP_CACHE_KEY } from './../constants/cache.constant';
import { PrismaService } from './../prisma/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(cacheManager, prisma, GROUP_CACHE_KEY);
  }

  async createGroup(userId: number, createGroupDto: CreateGroupDto) {
    const args = {
      data: {
        creator: { connect: { id: userId } },
        name: createGroupDto.groupName,
        members: {
          connect: createGroupDto.members.map((userId) => ({
            id: userId,
          })),
        },
      },
      include: {
        creator: true,
        members: true,
      },
    };
    return await this.createData(args);
  }

  async updateGroup(updateGroupDto: UpdateGroupDto) {
    const args = {
      where: {
        id: updateGroupDto.groupId,
      },
      data: {
        members: {
          set: updateGroupDto.members.map((userId) => ({
            id: userId,
          })),
        },
      },
      include: {
        creator: true,
        members: true,
      },
    };
    return await this.updateData(args);
  }

  async findGroupById(groupId: number) {
    return await this.getDataByUnique(
      { id: groupId },
      {
        creator: true,
        members: true,
      },
    );
  }

  async deleteGroup(groupId: number) {
    await this.deleteData(groupId);
    return { message: MSG_DELETE_GROUP_SUCCESSFUL };
  }

  async getGroupList() {
    return await this.getManyData(
      {},
      {
        creator: true,
        members: true,
      },
    );
  }
}
