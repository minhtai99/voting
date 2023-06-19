import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { UserDto } from './dto/user.dto';
import { User } from 'src/decorators/user.decorator';
import { UsersService } from './users.service';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { FieldName } from 'src/files/files.enum';

@UseGuards(JwtAuthGuard)
@Controller('profile')
@ApiTags('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getProfile(@User() user: UserDto) {
    return new UserDto(await this.usersService.findUserById(user.id));
  }

  @Patch()
  updateUser(@User() user: UserDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(user, updateUserDto);
  }

  @Patch(FieldName.AVATAR)
  @UseInterceptors(
    FileInterceptor(
      FieldName.AVATAR,
      FilesService.multerOptions({
        fileSize: 5,
        folder: 'avatars',
      }),
    ),
  )
  async uploadAvatar(
    @User() user: UserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    try {
      const destination = this.configService.get('UPLOADED_FILES_DESTINATION');

      if (user.avatarUrl) {
        fs.unlink(destination + '/' + user.avatarUrl, (err) => err);
      }
      const position: number = avatar.path.indexOf(avatar.fieldname);
      const avatarUrl: string = avatar.path.slice(position);
      return await this.usersService.updateUser(user, {
        avatarUrl,
      });
    } catch {
      fs.unlink(avatar.path, (err) => err);
    }
  }
}
