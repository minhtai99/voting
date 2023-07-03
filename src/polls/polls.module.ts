import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { PollSchedule } from './cron/poll.cron';

@Module({
  imports: [UsersModule, FilesModule],
  controllers: [PollsController],
  providers: [PollsService, PollSchedule],
  exports: [PollsService, PollSchedule],
})
export class PollsModule {}
