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
    if (createPollDto.isPublic === true) {
      const users = await this.usersService.getAllUsers();
      invitedUsers = users.map((user) => {
        return { id: user.id };
      });
    } else {
      invitedUsers = createPollDto.invitedUsers.map((userId) => {
        return { id: userId };
      });
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
}
