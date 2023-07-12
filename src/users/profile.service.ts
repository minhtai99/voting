import { FilesService } from './../files/files.service';
import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly filesService: FilesService) {}

  deleteAvatarFile(user: UserDto) {
    if (!user.avatarUrl) return;
    this.filesService.deleteFile(user.avatarUrl, 'avatars');
  }
}
