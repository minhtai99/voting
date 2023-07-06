import { MSG_VOTE_NOT_FOUND } from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../decorators/user.decorator';
import { VoteDto } from './dto/vote.dto';

@UseGuards(JwtAuthGuard)
@Controller('vote')
@ApiTags('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  createAndUpdateVote(
    @User() user: UserDto,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    return this.votesService.createAndUpdateVote(user, createVoteDto);
  }

  @Get()
  async getVoteById(@User() user: UserDto, @Body('token') token: string) {
    try {
      return new VoteDto(await this.votesService.findVoteByPollId(user, token));
    } catch {
      throw new NotFoundException(MSG_VOTE_NOT_FOUND);
    }
  }

  @Delete()
  deleteVote(@User() user: UserDto, @Body('token') token: string) {
    return this.votesService.deleteVote(user, token);
  }
}
