import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from 'src/users/dto/user.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import { CreateAnswerOptionDto } from 'src/answer-option/dto/create-answer-option.dto';
import { PollDto } from './dto/poll.dto';
import {
  MSG_ERROR_IMAGE_INDEX,
  MSG_SUCCESSFUL_POLL_CREATION,
} from 'src/constants/message.constant';
import { AnswerType } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { FilterPollDto } from './dto/filter-poll.dto';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createPoll(
    user: UserDto,
    createPollDto: CreatePollDto,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    let answerOptions = [];
    let invitedUsers = [];
    const payload = {
      title: createPollDto.title,
      question: createPollDto.question,
      answerType: createPollDto.answerType,
      backgroundUrl: backgroundUrl,
      startDate: createPollDto.startDate,
      endDate: createPollDto.endDate,
      isPublic: createPollDto.isPublic,
      status: createPollDto.status,
    };

    if (createPollDto.answerType !== AnswerType.input) {
      if (createPollDto.answerOptions !== undefined) {
        answerOptions = createPollDto.answerOptions.map(
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
      }
    }
    if (createPollDto.isPublic === true) {
      const users = await this.usersService.getAllUsers();
      invitedUsers = users.map((user) => {
        return { id: user.id };
      });
    } else {
      if (createPollDto.invitedUsers !== undefined) {
        invitedUsers = createPollDto.invitedUsers.map((userId) => {
          return { id: userId };
        });
      }
    }

    const poll = await this.prisma.poll.create({
      data: {
        ...payload,
        author: { connect: { id: user.id } },
        answerOptions: {
          create: answerOptions,
        },
        invitedUsers: {
          connect: invitedUsers,
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

  async getPollList(user: UserDto, filterPollDto: FilterPollDto) {
    const page = filterPollDto.page || 1;
    const size = filterPollDto.size || 10;
    const where = filterPollDto.where;
    const select = filterPollDto.select;
    const orderBy = filterPollDto.orderBy;
    const authorId = filterPollDto.isAuthor ? user.id : { not: user.id };

    const skip = (page - 1) * size;

    const total = await this.prisma.poll.count({
      where: {
        authorId: authorId,
        ...where,
      },
    });

    const polls = await this.prisma.poll.findMany({
      select,
      where: {
        authorId: authorId,
        ...where,
      },
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
}
