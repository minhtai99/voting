import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Request } from 'express';
import { UserDto } from 'src/users/dto/user.dto';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from './jwt.guard';
import { ForgotPassDto } from './dto/forgot-password.dto';
import { ResetPassDto } from './dto/reset-password.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() register: CreateUserDto) {
    return this.authService.register(register);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto, @Req() req: Request) {
    return this.authService.login(loginAuthDto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@User() user: UserDto, @Req() req: Request) {
    return this.authService.logout(user, req);
  }

  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    return this.authService.refreshToken(req);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPassDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPassDto) {
    return this.authService.resetPassword(body);
  }
}
