import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  async getAllUsers() {
    return { data: await this.usersService.getAllUsers() };
  }
}
