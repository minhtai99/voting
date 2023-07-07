import { Module, forwardRef } from '@nestjs/common';
import { PollResultService } from './poll-result.service';
import { PollsModule } from 'src/polls/polls.module';

@Module({
  imports: [forwardRef(() => PollsModule)],
  providers: [PollResultService],
  exports: [PollResultService],
})
export class PollResultModule {}
