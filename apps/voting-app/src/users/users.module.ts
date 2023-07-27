import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersController } from './users.controller';
import { FilesModule } from './../files/files.module';

@Module({
  imports: [forwardRef(() => FilesModule)],
  controllers: [ProfileController, UsersController],
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService],
})
export class UsersModule {}
