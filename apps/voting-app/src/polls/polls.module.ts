import { Module, forwardRef } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { PollSchedule } from './cron/poll.cron';
import { AnswerOptionModule } from 'src/answer-option/answer-option.module';
import { JwtModule } from '@nestjs/jwt';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => FilesModule),
    JwtModule.register({}),
    AnswerOptionModule,
    forwardRef(() => GroupsModule),
  ],
  controllers: [PollsController],
  providers: [PollsService, PollSchedule],
  exports: [PollsService, PollSchedule],
})
export class PollsModule {}
