import { Module, forwardRef } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { PollSchedule } from './cron/poll.cron';
import { AuthModule } from 'src/auth/auth.module';
import { AnswerOptionModule } from 'src/answer-option/answer-option.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => FilesModule),
    forwardRef(() => AuthModule),
    AnswerOptionModule,
  ],
  controllers: [PollsController],
  providers: [PollsService, PollSchedule],
  exports: [PollsService, PollSchedule],
})
export class PollsModule {}
