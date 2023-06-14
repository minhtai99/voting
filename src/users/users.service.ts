import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashData } from 'src/helpers/hash.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(register: CreateUserDto) {
    register.password = await hashData(register.password);

    const newUser = await this.prisma.user.create({
      data: register,
    });
    return new UserDto(newUser);
  }

  async updateRefreshToken(userId: number, refreshToken?: string | null) {
    const refreshTokenHash = refreshToken ? await hashData(refreshToken) : null;
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
    const resetPasswordHash = resetPass ? await hashData(resetPass) : null;
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

  async foundUserByEmail(email: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return new UserDto(foundUser);
  }
}
