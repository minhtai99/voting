import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PollsModule } from '../polls/polls.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PollsModule, AuthModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
