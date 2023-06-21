import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { UserDto } from './dto/user.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly configService: ConfigService) {}

  deleteAvatarFile(user: UserDto) {
    if (!user.avatarUrl) return;
    const destination = this.configService.get('UPLOADED_FILES_DESTINATION');
    fs.unlinkSync(`${destination}/${user.avatarUrl}`);
  }
}
