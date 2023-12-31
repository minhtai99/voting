import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import { fileConfig } from './../helpers/files.helper';
import { ChangePassDto } from './dto/change-password.dto';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UserDto } from './dto/user.dto';
import { User } from '../decorators/user.decorator';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { FieldName } from '../files/files.enum';
import { ProfileService } from './profile.service';
import { MSG_FILE_UPLOAD_FAILED } from '../constants/message.constant';

@UseGuards(JwtAuthGuard)
@Controller('profile')
@ApiTags('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: ProfileService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  async getProfile(@User() user: UserDto) {
    return await this.usersService.getUserById(user.id);
  }

  @Patch()
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
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
    new TransformDtoInterceptor(UserDto),
  )
  async updateAvatar(
    @User() user: UserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    try {
      const avatarUrl =
        fileConfig.domain +
        avatar.path.slice(avatar.path.indexOf(avatar.fieldname));
      const userUpdated = await this.usersService.updateUser(user, {
        avatarUrl,
      });

      this.profileService.deleteAvatarFile(user);
      return userUpdated;
    } catch {
      this.filesService.deleteFile(avatar.path, 'avatars');
      throw new InternalServerErrorException(MSG_FILE_UPLOAD_FAILED);
    }
  }

  @Patch('change-password')
  changePassword(@User() user: UserDto, @Body() changePassDto: ChangePassDto) {
    return this.usersService.changePassword(user, changePassDto);
  }
}
