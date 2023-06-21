import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from 'src/users/dto/user.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import { CreateAnswerOptionDto } from 'src/answer-option/dto/create-answer-option.dto';
import { PollDto } from './dto/poll.dto';
import { MSG_SUCCESSFUL_POLL_CREATION } from 'src/constants/message.constant';

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPoll(
    user: UserDto,
    createPollDto: CreatePollDto,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    const answerOptions = createPollDto.answerOptions.map(
      (answerOptions, index): CreateAnswerOptionDto => {
        return {
          content: answerOptions,
          pictureUrl: picturesUrl[index],
        };
      },
    );
    const invitedUsers = createPollDto.invitedUsers.map((email) => {
      return { email };
    });
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
