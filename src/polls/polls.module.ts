import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { AnswerOptionModule } from 'src/answer-option/answer-option.module';

@Module({
  imports: [AnswerOptionModule],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
