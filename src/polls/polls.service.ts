import { POLL_CACHE_KEY } from '../constants/cache.constant';
import { MailEvent } from './../mails/mails.enum';
import { FilesService } from './../files/files.service';
import { AuthService } from 'src/auth/auth.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from '../users/dto/user.dto';
import { PollDto } from './dto/poll.dto';
import {
  MSG_DELETE_POLL_SUCCESSFUL,
  MSG_END_DATE_GREATER_THAN_START_DATE,
  MSG_ERROR_IMAGE_INDEX,
  MSG_ERROR_SEND_MAIL_POLL,
  MSG_INVALID_PICTURES_FIELD,
  MSG_POLL_NOT_FOUND,
  MSG_START_DATE_LESS_THAN_END_DATE,
  MSG_UPDATE_SUCCESSFUL,
} from '../constants/message.constant';
import { AnswerType, PollStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { FilterPollDto } from './dto/filter-poll.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import * as fs from 'fs';
import { TokenType } from 'src/auth/auth.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailInvitationVote } from '../mails/interfaces/send-mail.interface';
import { AnswerOptionDto } from '../answer-option/dto/answer-option.dto';
import { AnswerOptionService } from '../answer-option/answer-option.service';
import { PostPollDto } from './dto/post-poll.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CrudService } from 'src/crud/crud.service';

@Injectable()
export class PollsService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly answerOptionService: AnswerOptionService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(cacheManager, prisma, POLL_CACHE_KEY);
  }

  async createPoll(
    user: UserDto,
    createPollDto: Partial<CreatePollDto>,
    pictures?: Express.Multer.File[],
    background?: Express.Multer.File[],
  ) {
    const { picturesUrl, backgroundUrl } =
      this.filesService.getPictureUrlAndBackgroundUrl(pictures, background);
    const data = await this.getPrismaPollData(
      createPollDto,
      picturesUrl,
      backgroundUrl,
    );

    const args = {
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
    };
    const poll = await this.createData(args);

    poll.token = await this.updatePollToken(poll.id);
    return poll;
  }

  async updatePoll(
    oldPoll: PollDto,
    postPollDto: Partial<PostPollDto>,
    pictures?: Express.Multer.File[],
    background?: Express.Multer.File[],
  ) {
    const { picturesUrl, backgroundUrl } =
      this.filesService.getPictureUrlAndBackgroundUrl(pictures, background);
    const updateData = await this.getPrismaPollData(
      postPollDto,
      picturesUrl,
      this.checkBackgroundUrl(postPollDto.backgroundUrl, backgroundUrl),
    );

    // delete AnswerOptions
    await this.updatePollDeleteAnswerOptions(
      oldPoll,
      postPollDto,
      updateData.answerOptions,
    );

    // delete backgroundUrl and file
    await this.updatePollDeleteBackgroundUrlAndFile(
      oldPoll,
      updateData.payload.backgroundUrl,
    );

    //delete PictureUrl and files
    await this.updatePollDeletePictureUrlAndFiles(
      oldPoll,
      postPollDto,
      updateData.answerOptions,
    );

    //update AnswerOptions
    const updateAnswerOptions = [];
    for (const answerOption of updateData.answerOptions) {
      if (answerOption.id) {
        updateAnswerOptions.push(
          await this.answerOptionService.updateAnswerOption(answerOption),
        );
      }
    }

    const args = {
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
    };
    const updatedPoll = await this.updateData(args);

    return updatedPoll;
  }

  async deletePoll(poll: PollDto) {
    if (poll.backgroundUrl !== null) {
      this.filesService.deleteFile(poll.backgroundUrl, 'images');
    }
    if (poll.answerOptions.length !== 0) {
      const picturesUrl = poll.answerOptions.map(
        (answerOption) => answerOption.pictureUrl,
      );
      picturesUrl.forEach((url) => this.filesService.deleteFile(url, 'images'));
    }
    await this.deleteData(poll.id);
    return { message: MSG_DELETE_POLL_SUCCESSFUL };
  }

  checkStartDateAndEndDateInCreatePoll(poll: Partial<PostPollDto>) {
    if (poll.startDate === undefined) {
      return {
        status: PollStatus.ongoing,
        startDate: new Date(),
      };
    } else {
      return {
        status: PollStatus.pending,
        startDate: poll.startDate,
      };
    }
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

      return { data: updatePoll };
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
  }

  async getPollList(filterPollDto: FilterPollDto) {
    const payload: any = await this.getList(filterPollDto);

    return {
      total: payload.total,
      currentPage: payload.currentPage,
      nextPage: payload.nextPage,
      prevPage: payload.prevPage,
      data: payload.data,
    };
  }

  async getPollById(pollId: number) {
    const poll: PollDto = await this.findPollById(pollId);
    return { data: poll, token: poll.token };
  }

  async findPollById(pollId: number) {
    const include = {
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
    };
    return await this.getDataByUnique({ id: pollId }, include);
  }

  async getPrismaPollData(
    pollDto: Partial<PostPollDto>,
    picturesUrl: string[],
    backgroundUrl: string | null,
  ) {
    let answerOptions = [];
    let invitedUsers = [];

    const payload = {
      title: pollDto.title,
      question: pollDto.question,
      answerType: pollDto.answerType,
      backgroundUrl: backgroundUrl?.replace(/\\+/g, '\\'),
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
        picturesUrl.forEach((url) => {
          this.filesService.deleteFile(url, 'images');
        });
        if (backgroundUrl) {
          this.filesService.deleteFile(backgroundUrl, 'images');
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
      const args = {
        where: payload.where,
        data: payload.data,
        include: {
          author: true,
          answerOptions: true,
          invitedUsers: true,
        },
      };
      const updatePoll = await this.updateData(args);

      return {
        message: MSG_UPDATE_SUCCESSFUL,
        data: updatePoll,
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
              lte: current,
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
    });
    return polls;
  }

  async getAllPollForScheduleVoteReminder() {
    const current = new Date();
    const polls = await this.prisma.poll.findMany({
      where: {
        endDate: {
          gte: new Date(current.getTime() + 60000 * 10), // current +  10m
          lte: new Date(current.getTime() + 60000 * 15), // current +  15m
        },
        status: 'ongoing',
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
        notIn: ['draft', 'pending'],
      },
    };
  }

  async updatePollToken(pollId: number) {
    const token = this.authService.createJWT(
      { pollId },
      TokenType.POLL_PERMISSION,
    );
    const args = {
      where: { id: pollId },
      data: {
        token,
      },
    };
    await this.updateData(args);
    return token;
  }

  async updatePollResultAnswer(pollId: number) {
    const poll = await this.findPollById(pollId);
    if (poll.answerOptions.length === 0) return;
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
          set: maxVoteArr.map((answerOption) => ({ id: answerOption.id })),
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

  checkBackgroundUrl(oldBackground: string, newBackground: string) {
    if (newBackground) {
      if (oldBackground) this.filesService.deleteFile(oldBackground, 'images');
      return newBackground;
    } else return oldBackground;
  }

  async updatePollDeleteAnswerOptions(
    oldPoll: PollDto,
    postPollDto: Partial<PostPollDto>,
    newAnswerOptions: AnswerOptionDto[],
  ) {
    if (
      oldPoll.answerOptions.length !== 0 &&
      postPollDto.answerType !== AnswerType.input
    ) {
      const arrayId = oldPoll.answerOptions
        .filter((answerOption) =>
          newAnswerOptions.every((item) => answerOption.id !== item.id),
        )
        .map((answerOption) => answerOption.id);

      await this.answerOptionService.deleteManyAnswerOption(arrayId);
    } else {
      const arrayId = oldPoll.answerOptions.map(
        (answerOption) => answerOption.id,
      );
      await this.answerOptionService.deleteManyAnswerOption(arrayId);
    }
  }

  async updatePollDeleteBackgroundUrlAndFile(
    oldPoll: PollDto,
    newBackgroundUrl: string,
  ) {
    if (oldPoll.backgroundUrl === null) return;
    if (newBackgroundUrl === undefined) {
      await this.prisma.poll.update({
        where: { id: oldPoll.id },
        data: {
          backgroundUrl: null,
        },
      });
    }
    if (newBackgroundUrl !== oldPoll.backgroundUrl) {
      this.filesService.deleteFile(oldPoll.backgroundUrl, 'images');
    }
  }

  async updatePollDeletePictureUrlAndFiles(
    oldPoll: PollDto,
    postPollDto: Partial<PostPollDto>,
    newAnswerOptions: AnswerOptionDto[],
  ) {
    if (postPollDto.answerType !== AnswerType.input) {
      const arrayId = newAnswerOptions
        .filter(
          (answerOption) => answerOption.pictureUrl === null && answerOption.id,
        )
        .map((item) => item.id);
      await this.answerOptionService.deletePictures(arrayId);

      const picturesUrl = oldPoll.answerOptions
        .filter((answerOption) =>
          newAnswerOptions.every(
            (item) =>
              item.pictureUrl !== null &&
              item.pictureUrl !== answerOption.pictureUrl &&
              answerOption.pictureUrl !== null,
          ),
        )
        .map((answerOption) => answerOption.pictureUrl);
      picturesUrl.forEach((url) => this.filesService.deleteFile(url, 'images'));
    } else {
      const picturesUrl = oldPoll.answerOptions.map(
        (answerOption) => answerOption.pictureUrl,
      );
      picturesUrl.forEach((url) => this.filesService.deleteFile(url, 'images'));
    }
  }

  deleteFilesIfThereIsAnError(images: {
    pictures?: Express.Multer.File[];
    background?: Express.Multer.File[];
  }) {
    if (images === undefined) return;
    if (images.background !== undefined)
      fs.unlink(images.background[0].path, (err) => err);
    if (images.pictures !== undefined)
      images.pictures.forEach((picture) => {
        if (picture === undefined) return;
        fs.unlink(picture.path, (err) => err);
      });
  }

  checkStartDateAndEndDateInEditPoll(
    oldPoll: PollDto,
    editPollDto: Partial<PostPollDto>,
  ) {
    if (editPollDto.endDate || editPollDto.startDate === undefined) {
      if (
        new Date(editPollDto.endDate).valueOf() <
        new Date(oldPoll.startDate).valueOf()
      ) {
        throw new BadRequestException(MSG_END_DATE_GREATER_THAN_START_DATE);
      }
    }
    if (editPollDto.endDate === undefined && editPollDto.startDate) {
      if (
        new Date(oldPoll.endDate).valueOf() <
        new Date(editPollDto.startDate).valueOf()
      ) {
        throw new BadRequestException(MSG_START_DATE_LESS_THAN_END_DATE);
      }
    }
  }
}
