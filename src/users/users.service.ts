import { UpdateUserDto } from './dto/update-user.dto';
import {
  BadRequestException,
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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany();
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

  async updatePassword(userId: number, newPassword: string) {
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

  async findUserById(userId: number) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return foundUser;
  }

  async findUserByEmail(email: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return foundUser;
  }
}
