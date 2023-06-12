import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashData } from 'src/helpers';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async register(registerAuthDto: RegisterAuthDto) {
    delete registerAuthDto.confirmPassword;
    const foundUser = await this.foundUserByEmail(registerAuthDto.email);

    if (foundUser) {
      throw new BadRequestException('Email already exists');
    }

    registerAuthDto.password = await hashData(registerAuthDto.password);

    const newUser = await this.prisma.user.create({
      data: registerAuthDto,
    });

    return new UserEntity(newUser);
  }

  async foundUserByEmail(email: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    return foundUser;
  }
}
