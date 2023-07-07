import { AuthService } from 'src/auth/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from '../users/dto/user.dto';
import { CreateAnswerOptionDto } from '../answer-option/dto/create-answer-option.dto';
import { PollDto } from './dto/poll.dto';
import {
  MSG_ERROR_IMAGE_INDEX,
  MSG_INVALID_PICTURES_FIELD,
  MSG_POLL_NOT_FOUND,
  MSG_SUCCESSFUL_POLL_CREATION,
} from '../constants/message.constant';
import { AnswerType, PollStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { FilterPollDto } from './dto/filter-poll.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { TokenType } from 'src/auth/auth.enum';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async createPoll(
    user: UserDto,
    createPollDto: Partial<CreatePollDto>,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    const data = await this.getPrismaPollData(
      createPollDto,
      picturesUrl,
      backgroundUrl,
    );

    const poll = await this.prisma.poll.create({
      data: {
        ...data.payload,
        author: { connect: { id: user.id } },
        answerOptions: {
          create: data.answerOptions,
        },
        invitedUsers: {
          connect: data.invitedUsers,
        },
      },
      include: {
        author: true,
        answerOptions: true,
        invitedUsers: true,
      },
    });
    poll.token = await this.updatePollToken(poll.id);
    return {
      message: MSG_SUCCESSFUL_POLL_CREATION,
      poll: new PollDto(poll),
    };
  }

  async getPollList(filterPollDto: FilterPollDto) {
    const page = filterPollDto.page || 1;
    const size = filterPollDto.size || 10;
    const where = filterPollDto.where;
    const select = filterPollDto.select;
    const orderBy = filterPollDto.orderBy;

    const skip = (page - 1) * size;

    const total = await this.prisma.poll.count({
      where,
    });

    const polls = await this.prisma.poll.findMany({
      select,
      where,
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
      polls: polls.map((poll) => new PollDto(poll)),
    };
  }

  async getPollById(user: UserDto, pollId: number) {
    const poll = await this.findPollById(pollId);
    return { poll: new PollDto(poll), token: poll.token };
  }

  async findPollById(pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        _count: true,
        author: true,
        answerOptions: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        invitedUsers: true,
        votes: {
          include: {
            participant: true,
            answers: true,
          },
        },
      },
    });
    return poll;
  }

  async findVoteByPollId(user: UserDto, pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        answerOptions: true,
        votes: {
          include: {
            answers: true,
          },
          where: {
            participantId: user.id,
          },
        },
      },
    });
    return new PollDto(poll);
  }

  async getPrismaPollData(
    pollDto: Partial<CreatePollDto>,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    let answerOptions = [];
    let invitedUsers = [];

    const payload = {
      title: pollDto.title,
      question: pollDto.question,
      answerType: pollDto.answerType,
      backgroundUrl: backgroundUrl,
      startDate: pollDto.startDate,
      endDate: pollDto.endDate,
      isPublic: pollDto.isPublic,
      status: pollDto.status,
    };

    if (pollDto.answerType !== AnswerType.input) {
      answerOptions = pollDto.answerOptions.map(
        (answerOption): CreateAnswerOptionDto => {
          if (
            picturesUrl[answerOption.imageIndex] === undefined &&
            answerOption.imageIndex !== undefined
          ) {
            throw new BadRequestException(MSG_ERROR_IMAGE_INDEX);
          }
          return {
            content: answerOption.content,
            pictureUrl: picturesUrl[answerOption.imageIndex],
          };
        },
      );
    } else {
      if (picturesUrl.length !== 0) {
        const destination = this.configService.get(
          'UPLOADED_FILES_DESTINATION',
        );
        picturesUrl.forEach((url) => {
          fs.unlink(
            `${destination}/${url.slice(url.indexOf('images'))}`,
            (err) => err,
          );
        });

        if (backgroundUrl) {
          fs.unlink(
            `${destination}/${backgroundUrl.slice(
              backgroundUrl.indexOf('images'),
            )}`,
            (err) => err,
          );
        }
        throw new BadRequestException(MSG_INVALID_PICTURES_FIELD);
      }
    }
    if (pollDto.isPublic === true) {
      const users = await this.usersService.getAllUsers();
      invitedUsers = users.map((user) => {
        return { id: user.id };
      });
    } else {
      invitedUsers = pollDto.invitedUsers.map((userId) => {
        return { id: userId };
      });
    }
    return {
      payload,
      answerOptions,
      invitedUsers,
    };
  }

  async updatePollStatus(pollId: number, status: PollStatus) {
    await this.updatePrismaPoll({
      where: { id: pollId },
      data: { status },
    });
  }

  async updatePrismaPoll(payload: { where: any; data: any }) {
    try {
      const updatePoll = await this.prisma.poll.update({
        where: payload.where,
        data: payload.data,
        include: {
          author: true,
          answerOptions: true,
          invitedUsers: true,
        },
      });
      return new PollDto(updatePoll);
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
  }

  async getAllPollForSchedule() {
    const current = new Date();
    const polls = await this.prisma.poll.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: new Date(current.getTime() - 60000 * 6), // current - 6m
              lte: new Date(current.getTime()),
            },
            status: 'pending',
          },
          {
            endDate: {
              gte: new Date(current.getTime() - 60000 * 6), // current - 6m
              lte: current,
            },
            status: 'ongoing',
          },
        ],
      },
      include: {
        votes: true,
        author: true,
        invitedUsers: true,
        answerOptions: {
          include: {
            _count: true,
          },
        },
      },
    });
    return polls;
  }

  filterParticipantPoll(userId: number) {
    return {
      invitedUsers: {
        some: {
          id: userId,
        },
      },
      authorId: { not: userId },
    };
  }

  async updatePollToken(pollId: number) {
    const token = this.authService.createJWT(
      { pollId },
      TokenType.POLL_PERMISSION,
    );
    await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        token,
      },
    });
    return token;
  }
}
