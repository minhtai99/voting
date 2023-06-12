import { UsersService } from './../users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}
  async register(registerAuthDto: RegisterAuthDto) {
    const foundUser = await this.usersService.foundUserByEmail(
      registerAuthDto.email,
    );
    if (foundUser) {
      throw new BadRequestException('Email is already registered');
    }

    return {
      message: 'Account created successfully!',
      data: await this.usersService.create(registerAuthDto),
    };
  }
}
