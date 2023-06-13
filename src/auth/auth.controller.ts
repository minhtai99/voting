import {
  Controller,
  Post,
  Body,
  Res,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';

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
  login(@Body() loginAuthDto: LoginAuthDto, @Res() res: Response) {
    return this.authService.login(loginAuthDto, res);
  }
}
