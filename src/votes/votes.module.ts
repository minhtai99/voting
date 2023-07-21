import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [PollsModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
