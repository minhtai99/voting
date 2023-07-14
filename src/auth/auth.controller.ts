import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from './jwt.guard';
import { ForgotPassDto } from './dto/forgot-password.dto';
import { ResetPassDto } from './dto/reset-password.dto';
import { RefreshJwtAuthGuard } from './refresh-jwt.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() register: CreateUserDto) {
    return this.authService.register(register);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@User() user: UserDto) {
    return this.authService.logout(user);
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  async refreshTokens(@User() user: UserDto) {
    return this.authService.refreshToken(user);
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
