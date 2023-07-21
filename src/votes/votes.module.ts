import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PollsModule } from '../polls/polls.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PollsModule, JwtModule.register({})],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
