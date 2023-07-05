import { MSG_VOTE_NOT_FOUND } from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../decorators/user.decorator';
import { VoteDto } from './dto/vote.dto';
import { IsAuthorGuard } from './is-author.guard';

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

  @Get(':id')
  @UseGuards(IsAuthorGuard)
  async getVoteById(@Param('id', ParseIntPipe) id: number) {
    try {
      return new VoteDto(await this.votesService.findVoteById(id));
    } catch {
      throw new NotFoundException(MSG_VOTE_NOT_FOUND);
    }
  }

  @Delete(':id')
  @UseGuards(IsAuthorGuard)
  deleteVote(@Param('id', ParseIntPipe) id: number) {
    return this.votesService.deleteVote(id);
  }
}
