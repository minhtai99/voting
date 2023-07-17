import { UpdateUserDto } from './dto/update-user.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { compareHashedData, hashData } from '../helpers/hash.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import {
  MSG_CHANGE_PASSWORD_SUCCESSFUL,
  MSG_CURRENT_PASSWORD_INCORRECT,
  MSG_CURRENT_PASS_MUST_DIFFERENT_NEW_PASS,
  MSG_UPDATE_FAIL,
  MSG_UPDATE_SUCCESSFUL,
} from '../constants/message.constant';
import { ChangePassDto } from './dto/change-password.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { USER_CACHE_KEY } from './../constants/cacher.constant';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async clearCache() {
    const keys: string[] = await this.cacheManager.store.keys();
    keys.forEach((key) => {
      if (key.startsWith(USER_CACHE_KEY)) {
        this.cacheManager.del(key);
      }
    });
  }

  async getAllUsers() {
    const cacheItems: UserDto[] = await this.cacheManager.get('user-all');
    if (!!cacheItems) {
      return cacheItems;
    }

    const users = await this.prisma.user.findMany();

    await this.cacheManager.set(
      'user-all',
      users.map((user) => new UserDto(user)),
    );
    return users.map((user) => new UserDto(user));
  }

  async updateUser(user: UserDto, updateUserDto: UpdateUserDto) {
    try {
      const updateUser = await this.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          ...updateUserDto,
        },
      });

      this.clearCache();
      return {
        message: MSG_UPDATE_SUCCESSFUL,
        user: new UserDto(updateUser),
      };
    } catch {
      throw new InternalServerErrorException(MSG_UPDATE_FAIL);
    }
  }

  async createUser(register: CreateUserDto) {
    register.password = await hashData(register.password);

    const newUser = await this.prisma.user.create({
      data: register,
    });

    this.clearCache();
    return newUser;
  }

  async updateRefreshTokenHash(userId: number, refreshToken?: string | null) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: await this.hashToken(refreshToken),
      },
    });
  }

  async updateResetPasswordHash(userId: number, resetPass?: string | null) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordHash: await this.hashToken(resetPass),
      },
    });
  }

  async hashToken(token?: string | null) {
    const tokenSlice = token ? token.slice(token.lastIndexOf('.')) : null;
    const tokenHashed = tokenSlice ? await hashData(tokenSlice) : null;
    return tokenHashed;
  }

  async updatePassword(userId: number, newPassword: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await hashData(newPassword),
        resetPasswordHash: null,
      },
    });
  }

  async changePassword(user: UserDto, changePassDto: ChangePassDto) {
    if (changePassDto.currentPassword === changePassDto.newPassword) {
      throw new BadRequestException(MSG_CURRENT_PASS_MUST_DIFFERENT_NEW_PASS);
    }

    const isMatch = await compareHashedData(
      changePassDto.currentPassword,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException(MSG_CURRENT_PASSWORD_INCORRECT);
    }

    await this.updatePassword(user.id, changePassDto.newPassword);

    this.clearCache();
    return { message: MSG_CHANGE_PASSWORD_SUCCESSFUL };
  }

  async getUserById(userId: number) {
    const cacheItem: UserDto = await this.cacheManager.get(`user-${userId}`);
    if (!!cacheItem) {
      return cacheItem;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    await this.cacheManager.set(`user-${userId}`, new UserDto(user));
    return new UserDto(user);
  }

  async findUserByEmail(email: string) {
    const cacheItem: UserDto = await this.cacheManager.get(`user-${email}`);
    if (!!cacheItem) {
      return cacheItem;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    await this.cacheManager.set(`user-${email}`, user);
    return user;
  }
}
