import { PollsService } from './../polls/polls.service';
import { POLL_CACHE_KEY, VOTE_CACHE_KEY } from '../constants/cache.constant';
import {
  MSG_DELETE_VOTE_SUCCESSFUL,
  MSG_POLL_STATUS_MUST_ONGOING,
  MSG_SUCCESSFUL_VOTE_CREATION,
  MSG_VOTE_NOT_FOUND,
} from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { AnswerType, PollStatus } from '@prisma/client';
import { PollDto } from './../polls/dto/poll.dto';
import { Request } from 'express';
import { FilterVoteDto } from './dto/filter-vote.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CrudService } from './../crud/crud.service';

@Injectable()
export class VotesService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly pollsService: PollsService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(cacheManager, prisma, VOTE_CACHE_KEY);
  }

  async upsert(user: UserDto, createVoteDto: CreateVoteDto, req: Request) {
    const poll: PollDto = req['poll'];
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_MUST_ONGOING);
    }
    this.votingDataValidation(poll, createVoteDto);

    const args = {
      where: {
        pollId_participantId: {
          participantId: user.id,
          pollId: poll.id,
        },
      },
      update: {
        input: createVoteDto.input,
        answers: {
          set: createVoteDto.answerOptions.map((id) => ({ id })),
        },
      },
      create: {
        poll: { connect: { id: poll.id } },
        input: createVoteDto.input,
        participant: { connect: { id: user.id } },
        answers: {
          connect: createVoteDto.answerOptions.map((id) => ({ id })),
        },
      },
      include: {
        answers: true,
        poll: {
          include: {
            author: true,
          },
        },
      },
    };
    const vote = await this.upsertData(args);
    await this.clearCacheWithKey(POLL_CACHE_KEY);
    return { message: MSG_SUCCESSFUL_VOTE_CREATION, data: vote };
  }

  async getVoteByPollId(user: UserDto, req: Request) {
    const poll: PollDto = req['poll'];
    return await this.pollsService.findVoteByPollIdAndUserId(user.id, poll.id);
  }

  async getVotingList(filterVoteDto: FilterVoteDto) {
    const payload: any = await this.getList(filterVoteDto);

    return {
      total: payload.total,
      currentPage: payload.currentPage,
      nextPage: payload.nextPage,
      prevPage: payload.prevPage,
      data: payload.data,
    };
  }

  // async deleteVote(user: UserDto, req: Request) {
  //   try {
  //     const poll: PollDto = req['poll'];
  //     await this.prisma.vote.delete({
  //       where: {
  //         pollId_participantId: {
  //           participantId: user.id,
  //           pollId: poll.id,
  //         },
  //       },
  //     });
  //     return { message: MSG_DELETE_VOTE_SUCCESSFUL };
  //   } catch (error) {
  //     throw new BadRequestException(MSG_VOTE_NOT_FOUND);
  //   }
  // }

  votingDataValidation(poll: PollDto, voteDto: CreateVoteDto) {
    if (poll.answerType === AnswerType.input) {
      if (voteDto.answerOptions.length !== 0)
        throw new BadRequestException(
          'Invalid answerOptions field for Poll answer type',
        );
      if (!voteDto.input)
        throw new BadRequestException('Input field should not be empty');
    }
    if (poll.answerType !== AnswerType.input) {
      if (voteDto.input)
        throw new BadRequestException(
          'Invalid input field for Poll answer type',
        );
      if (voteDto.answerOptions.length === 0) {
        throw new BadRequestException(
          'AnswerOptions field must contain at least 1 answer',
        );
      }
      const isMatch = voteDto.answerOptions.map((answer) => {
        return poll.answerOptions.find(
          (answerOption) => answerOption.id === answer,
        );
      });
      if (isMatch.some((e) => e === undefined)) {
        throw new BadRequestException('AnswerOptions provided is not valid');
      }
    }
  }
}
