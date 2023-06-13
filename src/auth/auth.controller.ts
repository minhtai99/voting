import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Request } from 'express';
import { UserDto } from 'src/users/dto/user.dto';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor)
  register(@Body() register: CreateUserDto) {
    return this.authService.register(register);
  }

  @Post('login')
  @UseInterceptors(ClassSerializerInterceptor)
  login(@Body() loginAuthDto: LoginAuthDto, @Req() req: Request) {
    return this.authService.login(loginAuthDto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@User() user: UserDto, @Req() req: Request) {
    return this.authService.logout(user, req);
  }

  @Post('refresh')
  @UseInterceptors(ClassSerializerInterceptor)
  async refreshTokens(@Req() req: Request) {
    return this.authService.refreshToken(req);
  }
}
