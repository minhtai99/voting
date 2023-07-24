import { VoteDto } from 'src/votes/dto/vote.dto';
import { TransformDtoInterceptor } from './../interceptors/transform-dto.interceptor';
import { MSG_VOTE_NOT_FOUND } from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { User } from '../decorators/user.decorator';
import { VoteGuard } from './vote.guard';
import { Request } from 'express';
import { FilterVoteDto } from './dto/filter-vote.dto';
import { PollDto } from 'src/polls/dto/poll.dto';

@UseGuards(JwtAuthGuard)
@Controller('vote')
@ApiTags('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(VoteGuard)
  @UseInterceptors(new TransformDtoInterceptor(VoteDto))
  createAndUpdateVote(
    @User() user: UserDto,
    @Body() createVoteDto: CreateVoteDto,
    @Req() req: Request,
  ) {
    return this.votesService.upsert(user, createVoteDto, req);
  }

  @ApiBody({
    schema: {
      properties: { token: { description: 'string', type: 'string' } },
    },
  })
  @Post('get-vote')
  @UseGuards(VoteGuard)
  @UseInterceptors(new TransformDtoInterceptor(PollDto))
  async getVote(@User() user: UserDto, @Req() req: Request) {
    try {
      return { data: await this.votesService.getVoteByPollId(user, req) };
    } catch {
      throw new NotFoundException(MSG_VOTE_NOT_FOUND);
    }
  }

  @Post(':pollId/search')
  @UseGuards(VoteGuard)
  @UseInterceptors(new TransformDtoInterceptor(VoteDto))
  async getVotingList(
    @Body() filterVoteDto: FilterVoteDto,
    @Param('pollId', ParseIntPipe) pollId: number,
  ) {
    try {
      filterVoteDto.where = {
        pollId,
        ...filterVoteDto.where,
      };
      return this.votesService.getVotingList(filterVoteDto);
    } catch {
      throw new NotFoundException(MSG_VOTE_NOT_FOUND);
    }
  }

  // @Delete()
  // @UseGuards(VoteGuard)
  // deleteVote(@User() user: UserDto, @Req() req: Request) {
  //   return this.votesService.deleteVote(user, req);
  // }
}
