import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { UserDto } from './dto/user.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly configService: ConfigService) {}

  deleteAvatarFile(user: UserDto) {
    const destination = this.configService.get('UPLOADED_FILES_DESTINATION');
    const avatarUrl = destination + '/' + user.avatarUrl;

    if (avatarUrl) {
      fs.unlink(avatarUrl, (err) => err);
    }
  }
}
