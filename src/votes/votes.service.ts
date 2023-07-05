import {
  MSG_DELETE_VOTE_SUCCESSFUL,
  MSG_POLL_STATUS_NOT_ONGOING,
  MSG_SUCCESSFUL_VOTE_CREATION,
  MSG_VOTE_NOT_FOUND,
} from '../constants/message.constant';
import { PollsService } from '../polls/polls.service';
import { UserDto } from '../users/dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteDto } from './dto/vote.dto';
import { AnswerType, PollStatus } from '@prisma/client';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  async createAndUpdateVote(user: UserDto, createVoteDto: CreateVoteDto) {
    const poll = await this.pollsService.findPollById(createVoteDto.pollId);
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_NOT_ONGOING);
    }
    this.checkAnswerType(poll.answerType, createVoteDto);

    const vote = await this.prisma.vote.upsert({
      where: {
        pollId_participantId: {
          participantId: user.id,
          pollId: createVoteDto.pollId,
        },
      },
      update: {
        input: createVoteDto.input,
        answerOptions: {
          set: createVoteDto.answerOptions.map((id) => ({ id })),
        },
      },
      create: {
        poll: { connect: { id: createVoteDto.pollId } },
        input: createVoteDto.input,
        participant: { connect: { id: user.id } },
        answerOptions: {
          connect: createVoteDto.answerOptions.map((id) => ({ id })),
        },
      },
      include: {
        answerOptions: true,
        poll: {
          include: {
            author: true,
          },
        },
      },
    });
    return { message: MSG_SUCCESSFUL_VOTE_CREATION, vote: new VoteDto(vote) };
  }

  async findVoteByPollId(user: UserDto, pollId: number) {
    return await this.prisma.vote.findUnique({
      where: {
        pollId_participantId: { participantId: user.id, pollId },
      },
      include: {
        participant: true,
        answerOptions: true,
        poll: {
          include: {
            author: true,
          },
        },
      },
    });
  }

  async deleteVote(user: UserDto, pollId: number) {
    try {
      await this.prisma.vote.delete({
        where: { pollId_participantId: { participantId: user.id, pollId } },
      });
      return { message: MSG_DELETE_VOTE_SUCCESSFUL };
    } catch (error) {
      throw new BadRequestException(MSG_VOTE_NOT_FOUND);
    }
  }

  checkAnswerType(answerType: AnswerType, voteDto: CreateVoteDto) {
    if (answerType === AnswerType.input) {
      if (voteDto.answerOptions.length !== 0)
        throw new BadRequestException(
          'Invalid answerOptions field for Poll answer type',
        );
      if (!voteDto.input)
        throw new BadRequestException('Input field should not be empty');
    }
    if (answerType !== AnswerType.input) {
      if (voteDto.input)
        throw new BadRequestException(
          'Invalid input field for Poll answer type',
        );
      if (voteDto.answerOptions.length === 0) {
        throw new BadRequestException(
          'AnswerOptions field must contain at least 1 answer',
        );
      }
    }
  }
}
