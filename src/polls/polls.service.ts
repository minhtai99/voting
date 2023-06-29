import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from '../users/dto/user.dto';
import { CreateAnswerOptionDto } from '../answer-option/dto/create-answer-option.dto';
import { PollDto } from './dto/poll.dto';
import {
  MSG_ERROR_IMAGE_INDEX,
  MSG_INVALID_PICTURES_FIELD,
  MSG_SUCCESSFUL_POLL_CREATION,
} from '../constants/message.constant';
import { AnswerType } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { FilterPollDto } from './dto/filter-poll.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
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

  async findPollById(pollId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        _count: true,
        author: true,
        answerOptions: true,
        invitedUsers: true,
        votes: true,
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

        fs.unlink(
          `${destination}/${backgroundUrl.slice(
            backgroundUrl.indexOf('images'),
          )}`,
          (err) => err,
        );
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

  filterParticipantPoll(userId: number) {
    return {
      OR: [
        {
          invitedUsers: {
            some: {
              id: userId,
            },
          },
        },
        {
          votes: {
            some: {
              participantId: userId,
            },
          },
        },
      ],
    };
  }
}
