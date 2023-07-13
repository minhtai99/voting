import { PollsService } from './../polls/polls.service';
import {
  MSG_DELETE_VOTE_SUCCESSFUL,
  MSG_POLL_STATUS_MUST_ONGOING,
  MSG_SUCCESSFUL_VOTE_CREATION,
  MSG_VOTE_NOT_FOUND,
} from '../constants/message.constant';
import { UserDto } from '../users/dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteDto } from './dto/vote.dto';
import { AnswerType, PollStatus } from '@prisma/client';
import { PollDto } from 'src/polls/dto/poll.dto';
import { Request } from 'express';
import { FilterVoteDto } from './dto/filter-vote.dto';
@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  async upsert(user: UserDto, createVoteDto: CreateVoteDto, req: Request) {
    const poll: PollDto = req['poll'];
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_MUST_ONGOING);
    }
    this.votingDataValidation(poll, createVoteDto);

    const vote = await this.prisma.vote.upsert({
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
    });
    return { message: MSG_SUCCESSFUL_VOTE_CREATION, vote: new VoteDto(vote) };
  }

  async findVoteByPollId(user: UserDto, req: Request) {
    const poll: PollDto = req['poll'];
    return this.pollsService.findVoteByPollId(user, poll.id);
  }

  async getVotingList(filterVoteDto: FilterVoteDto) {
    const page = filterVoteDto.page || 1;
    const size = filterVoteDto.size || 10;
    const where = filterVoteDto.where;
    const select = filterVoteDto.select;
    const orderBy = filterVoteDto.orderBy;

    const skip = (page - 1) * size;

    const total = await this.prisma.vote.count({
      where,
    });

    const votes = await this.prisma.vote.findMany({
      where,
      select,
      skip,
      take: size,
      orderBy,
    });
    const nextPage = page + 1 > Math.ceil(total / size) ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      total: total,
      currentPage: page,
      nextPage,
      prevPage,
      votes: votes.map((vote) => new VoteDto(vote)),
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
