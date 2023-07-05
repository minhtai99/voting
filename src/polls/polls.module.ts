import { Module, forwardRef } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { PollSchedule } from './cron/poll.cron';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UsersModule, FilesModule, forwardRef(() => AuthModule)],
  controllers: [PollsController],
  providers: [PollsService, PollSchedule],
  exports: [PollsService, PollSchedule],
})
export class PollsModule {}
