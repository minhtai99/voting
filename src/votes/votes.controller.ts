import { MSG_VOTE_NOT_FOUND } from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { User } from '../decorators/user.decorator';
import { VoteTokenGuard } from './vote.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('vote')
@ApiTags('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(VoteTokenGuard)
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
  @UseGuards(VoteTokenGuard)
  async getVote(@User() user: UserDto, @Req() req: Request) {
    try {
      return this.votesService.findVoteByPollId(user, req);
    } catch {
      throw new NotFoundException(MSG_VOTE_NOT_FOUND);
    }
  }

  // @Delete()
  // @UseGuards(VoteTokenGuard)
  // deleteVote(@User() user: UserDto, @Req() req: Request) {
  //   return this.votesService.deleteVote(user, req);
  // }
}
