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
import { USER_CACHE_KEY } from '../constants/cache.constant';
import { CrudService } from 'src/crud/crud.service';

@Injectable()
export class UsersService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(cacheManager, prisma, USER_CACHE_KEY);
  }

  async getAllUsers() {
    const cacheItems: UserDto[] = await this.cacheManager.get(
      `${USER_CACHE_KEY}-all`,
    );
    if (!!cacheItems) {
      return cacheItems;
    }

    const users = await this.prisma.user.findMany();
    await this.cacheManager.set(`${USER_CACHE_KEY}-all`, users);
    return users;
  }

  async updateUser(user: UserDto, updateUserDto: UpdateUserDto) {
    try {
      const args = {
        where: {
          email: user.email,
        },
        data: {
          ...updateUserDto,
        },
      };
      const updateUser = await this.updateData(args);

      return {
        message: MSG_UPDATE_SUCCESSFUL,
        data: updateUser,
      };
    } catch {
      throw new InternalServerErrorException(MSG_UPDATE_FAIL);
    }
  }

  async createUser(register: CreateUserDto) {
    register.password = await hashData(register.password);
    const args = {
      data: register,
    };

    return await this.createData(args);
  }

  async updateRefreshTokenHash(userId: number, refreshToken?: string | null) {
    const args = {
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: await this.hashToken(refreshToken),
      },
    };
    await this.updateData(args);
  }

  async updateResetPasswordHash(userId: number, resetPass?: string | null) {
    const args = {
      where: {
        id: userId,
      },
      data: {
        resetPasswordHash: await this.hashToken(resetPass),
      },
    };
    await this.updateData(args);
  }

  async hashToken(token?: string | null) {
    const tokenSlice = token ? token.slice(token.lastIndexOf('.')) : null;
    const tokenHashed = tokenSlice ? await hashData(tokenSlice) : null;
    return tokenHashed;
  }

  async updatePassword(userId: number, newPassword: string) {
    const args = {
      where: {
        id: userId,
      },
      data: {
        password: await hashData(newPassword),
        resetPasswordHash: null,
      },
    };
    await this.updateData(args);
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

    return { message: MSG_CHANGE_PASSWORD_SUCCESSFUL };
  }

  async getUserById(userId: number) {
    return { data: await this.getDataByUnique({ id: userId }) };
  }

  async findUserByEmail(email: string) {
    return await this.getDataByUnique({ email });
  }
}
