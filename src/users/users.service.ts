import { UpdateUserDto } from './dto/update-user.dto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashData } from 'src/helpers/hash.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import {
  MSG_UPDATE_FAIL,
  MSG_UPDATE_SUCCESSFUL,
} from 'src/constants/message.constant';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    return newUser;
  }

  async updateRefreshTokenHash(userId: number, refreshToken?: string | null) {
    const refreshTokenSlice = refreshToken
      ? refreshToken.slice(refreshToken.lastIndexOf('.'))
      : null;
    const refreshTokenHash = refreshTokenSlice
      ? await hashData(refreshTokenSlice)
      : null;
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash,
      },
    });
  }

  async updateResetPasswordHash(userId: number, resetPass?: string | null) {
    const resetPasswordSlice = resetPass
      ? resetPass.slice(resetPass.lastIndexOf('.'))
      : null;
    const resetPasswordHash = resetPasswordSlice
      ? await hashData(resetPasswordSlice)
      : null;
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordHash,
      },
    });
  }

  async resetPassword(userId: number, newPassword: string) {
    const hashedPass = await hashData(newPassword);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPass,
        resetPasswordHash: null,
      },
    });
  }

  async findUserById(userId: number) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return foundUser;
  }

  async foundUserByEmail(email: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return foundUser;
  }
}
