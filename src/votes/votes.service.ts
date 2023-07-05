import {
  MSG_DELETE_VOTE_SUCCESSFUL,
  MSG_SUCCESSFUL_VOTE_CREATION,
  MSG_UPDATE_SUCCESSFUL,
  MSG_USER_VOTED,
} from '../constants/message.constant';
import { PollsService } from '../polls/polls.service';
import { UserDto } from '../users/dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteDto } from './dto/vote.dto';
import { AnswerType } from '@prisma/client';
import { UpdateVoteDto } from './dto/update-vote.dto';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  async createVote(user: UserDto, createVoteDto: CreateVoteDto) {
    const voteExisted = await this.prisma.vote.findFirst({
      where: { participantId: user.id },
    });
    if (voteExisted) {
      throw new BadRequestException(MSG_USER_VOTED);
    }

    const poll = await this.pollsService.findPollById(createVoteDto.pollId);
    this.checkAnswerType(poll.answerType, createVoteDto);

    const vote = await this.prisma.vote.create({
      data: {
        poll: { connect: { id: createVoteDto.pollId } },
        input: createVoteDto.input,
        participant: { connect: { id: user.id } },
        answerOptions: {
          connect: createVoteDto.answerOptions.map((id) => ({ id })),
        },
      },
      include: {
        answerOptions: true,
        poll: true,
      },
    });
    return { message: MSG_SUCCESSFUL_VOTE_CREATION, vote: new VoteDto(vote) };
  }

  async findVoteById(voteId: number) {
    return await this.prisma.vote.findUnique({
      where: {
        id: voteId,
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

  async updateVote(updateVoteDto: UpdateVoteDto) {
    const vote = await this.findVoteById(updateVoteDto.voteId);
    this.checkAnswerType(vote.poll.answerType, updateVoteDto);

    const updateVote = await this.prisma.vote.update({
      where: {
        id: updateVoteDto.voteId,
      },
      data: {
        input: updateVoteDto.input,
        answerOptions: {
          set: updateVoteDto.answerOptions.map((id) => ({ id })),
        },
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
    return { message: MSG_UPDATE_SUCCESSFUL, vote: new VoteDto(updateVote) };
  }

  async deleteVote(voteId: number) {
    await this.prisma.vote.delete({
      where: { id: voteId },
    });
    return { message: MSG_DELETE_VOTE_SUCCESSFUL };
  }

  checkAnswerType(
    answerType: AnswerType,
    voteDto: CreateVoteDto | UpdateVoteDto,
  ) {
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
          'AnswerOptions field must contain at least 1 elements',
        );
      }
    }
  }
}
