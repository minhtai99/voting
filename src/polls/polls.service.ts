import { MailEvent } from './../mails/mails.enum';
import { FilesService } from './../files/files.service';
import { AuthService } from 'src/auth/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from '../users/dto/user.dto';
import { PollDto } from './dto/poll.dto';
import {
  MSG_ERROR_IMAGE_INDEX,
  MSG_ERROR_SEND_MAIL_POLL,
  MSG_INVALID_PICTURES_FIELD,
  MSG_POLL_NOT_FOUND,
  MSG_UPDATE_SUCCESSFUL,
} from '../constants/message.constant';
import { AnswerType, PollStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { FilterPollDto } from './dto/filter-poll.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { TokenType } from 'src/auth/auth.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailInvitationVote } from '../mails/interfaces/send-mail.interface';
import { AnswerOptionDto } from '../answer-option/dto/answer-option.dto';
import { AnswerOptionService } from '../answer-option/answer-option.service';
import { UpdatePollDto } from './dto/update-poll.dto';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly answerOptionService: AnswerOptionService,
    private readonly filesService: FilesService,
    private readonly eventEmitter: EventEmitter2,
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
    return new PollDto(poll);
  }

  async updatePoll(
    oldPoll: PollDto,
    updatePollDto: Partial<UpdatePollDto>,
    picturesUrl?: string[],
    backgroundUrl?: string | null,
  ) {
    const updateData = await this.getPrismaPollData(
      updatePollDto,
      picturesUrl,
      backgroundUrl,
    );

    // delete AnswerOptions
    if (
      oldPoll.answerOptions.length !== 0 &&
      updatePollDto.answerType !== AnswerType.input
    ) {
      const arrayId = oldPoll.answerOptions
        .filter((answerOption) =>
          updateData.answerOptions.every((item) => answerOption.id !== item.id),
        )
        .map((answerOption) => answerOption.id);

      await this.answerOptionService.deleteManyAnswerOption(arrayId);
    } else {
      const arrayId = oldPoll.answerOptions.map(
        (answerOption) => answerOption.id,
      );
      await this.answerOptionService.deleteManyAnswerOption(arrayId);
    }

    // delete backgroundUrl and file
    if (oldPoll.backgroundUrl !== null) {
      if (updateData.payload.backgroundUrl !== oldPoll.backgroundUrl)
        this.filesService.deleteFile(oldPoll.backgroundUrl, 'images');

      if (updateData.payload.backgroundUrl === undefined)
        updateData.payload.backgroundUrl = null;
    }

    //delete PictureUrl and files
    if (updatePollDto.answerType !== AnswerType.input) {
      const arrayId = updateData.answerOptions
        .filter(
          (answerOption) => answerOption.pictureUrl === null && answerOption.id,
        )
        .map((item) => item.id);
      await this.answerOptionService.deletePictures(arrayId);

      const picturesUrl = oldPoll.answerOptions
        .filter((answerOption) =>
          updateData.answerOptions.every(
            (item) =>
              item.pictureUrl !== null &&
              item.pictureUrl !== answerOption.pictureUrl &&
              answerOption.pictureUrl !== null,
          ),
        )
        .map((answerOption) => answerOption.pictureUrl);
      picturesUrl.forEach((url) => this.filesService.deleteFile(url, 'images'));
    }

    //update AnswerOptions
    const updateAnswerOptions = [];
    for (const answerOption of updateData.answerOptions) {
      if (answerOption.id) {
        updateAnswerOptions.push(
          await this.answerOptionService.updateAnswerOption(answerOption),
        );
      }
    }

    const updatedPoll = await this.prisma.poll.update({
      where: {
        id: oldPoll.id,
      },
      data: {
        ...updateData.payload,
        answerOptions: {
          create: updateData.answerOptions.filter(
            (answerOption) => answerOption.id === undefined,
          ),
        },
        invitedUsers: {
          set: updateData.invitedUsers,
        },
      },
      include: {
        author: true,
        answerOptions: true,
        invitedUsers: true,
      },
    });

    return new PollDto(updatedPoll);
  }

  async updateInvitePeople(poll: PollDto, invitedUsers: number[]) {
    try {
      const newInvitedUsers = invitedUsers.filter((id) =>
        poll.invitedUsers.every((user) => user.id !== id),
      );

      const payload = {
        where: { id: poll.id },
        data: {
          invitedUsers: {
            set: invitedUsers.map((userId) => ({ id: userId })),
          },
        },
      };
      const updatePoll = await this.updatePrismaPoll(payload);

      const payloadInvitation: MailInvitationVote = {
        pollId: poll.id,
        invitedUsers: newInvitedUsers,
      };
      this.eventEmitter.emit(
        MailEvent.SEND_MAIL_ADD_INVITATION_VOTE,
        payloadInvitation,
      );

      return updatePoll;
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
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
    pollDto: Partial<UpdatePollDto>,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    let answerOptions = [];
    let invitedUsers = [];

    const payload = {
      title: pollDto.title,
      question: pollDto.question,
      answerType: pollDto.answerType,
      backgroundUrl: pollDto.backgroundUrl ?? backgroundUrl,
      startDate: pollDto.startDate,
      endDate: pollDto.endDate,
      isPublic: pollDto.isPublic,
      status: pollDto.status,
    };
    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === null) &&
        delete payload[key],
    );

    if (pollDto.answerType !== AnswerType.input) {
      answerOptions = pollDto.answerOptions.map(
        (answerOption): Partial<AnswerOptionDto> => {
          if (
            picturesUrl[answerOption.imageIndex] === undefined &&
            answerOption.imageIndex !== undefined &&
            answerOption.imageIndex !== -1
          ) {
            throw new BadRequestException(MSG_ERROR_IMAGE_INDEX);
          }

          const payload = {
            id: answerOption.id,
            content: answerOption.content,
            pictureUrl:
              answerOption.imageIndex === -1
                ? null
                : picturesUrl[answerOption.imageIndex],
          };
          Object.keys(payload).forEach(
            (key) => payload[key] === undefined && delete payload[key],
          );
          return payload;
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
    return await this.updatePrismaPoll({
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
      return {
        message: MSG_UPDATE_SUCCESSFUL,
        poll: new PollDto(updatePoll),
      };
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
      status: {
        not: 'draft',
      },
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

  async updatePollResultAnswer(pollId: number) {
    const poll = await this.findPollById(pollId);
    const maxVote = poll.answerOptions.reduce((prev, current) =>
      prev._count.votes > current._count.votes ? prev : current,
    );

    const maxVoteArr = poll.answerOptions.filter(
      (answerOption) => answerOption._count.votes === maxVote._count.votes,
    );
    const payload = {
      where: { id: poll.id },
      data: {
        answer: {
          connect: maxVoteArr.map((answerOption) => ({ id: answerOption.id })),
        },
      },
    };
    this.updatePrismaPoll(payload);
  }

  async sendPollEmail(poll: PollDto) {
    if (
      poll.status === PollStatus.draft ||
      poll.status === PollStatus.pending
    ) {
      throw new BadRequestException(MSG_ERROR_SEND_MAIL_POLL);
    }

    if (poll.status === PollStatus.ongoing) {
      const payloadInvitation: MailInvitationVote = {
        pollId: poll.id,
      };

      this.eventEmitter.emit(
        MailEvent.SEND_MAIL_INVITATION_VOTE,
        payloadInvitation,
      );
    }

    if (poll.status === PollStatus.completed) {
      await this.updatePollResultAnswer(poll.id);

      this.eventEmitter.emit(
        MailEvent.SEND_MAIL_POLL_ENDED_PARTICIPANT,
        poll.id,
      );

      this.eventEmitter.emit(MailEvent.SEND_MAIL_POLL_ENDED_AUTHOR, poll.id);
    }
  }
}
