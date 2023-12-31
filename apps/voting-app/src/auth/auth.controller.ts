import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from './jwt.guard';
import { ForgotPassDto } from './dto/forgot-password.dto';
import { ResetPassDto } from './dto/reset-password.dto';
import { Request } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  register(@Body() register: CreateUserDto) {
    return this.authService.register(register);
  }

  @Post('login')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@User() user: UserDto) {
    return this.authService.logout(user);
  }

  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    return this.authService.refreshToken(req);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPassDto: ForgotPassDto) {
    return this.authService.forgotPassword(forgotPassDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPassDto: ResetPassDto) {
    return this.authService.resetPassword(resetPassDto);
  }
}
