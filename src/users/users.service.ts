import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { RegisterAuthDto } from 'src/auth/dto';
import { hashData } from 'src/helpers/hash.helper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(register: RegisterAuthDto) {
    register.password = await hashData(register.password);

    const newUser = await this.prisma.user.create({
      data: register,
    });
    return new UserEntity(newUser);
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
