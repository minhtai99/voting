import { MailInvitationVote } from './../mails/interfaces/send-mail.interface';
import { MailEvent } from './../mails/mails.enum';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
  Get,
  Param,
  ParseIntPipe,
  HttpException,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateDraftPollDto } from './dto/create-draft-poll.dto';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../decorators/user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { FieldName } from '../files/files.enum';
import * as fs from 'fs';
import { MSG_POLL_NOT_FOUND } from '../constants/message.constant';
import { FilterPollDto } from './dto/filter-poll.dto';
import { PollStatus } from '@prisma/client';
import { CreatePollDto } from './dto/create-poll.dto';
import { UploadFilesErrorsInterceptor } from './interceptors/poll-errors.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';

@UseGuards(JwtAuthGuard)
@Controller('polls')
@ApiTags('polls')
export class PollsController {
  constructor(
    private readonly pollsService: PollsService,
    private readonly filesService: FilesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @UseInterceptors(
    new UploadFilesErrorsInterceptor(),
    FileFieldsInterceptor(
      [
        { name: FieldName.PICTURES, maxCount: 10 },
        { name: FieldName.BACKGROUND, maxCount: 1 },
      ],
      FilesService.multerOptions({
        fileSize: 5,
        folder: 'images',
      }),
    ),
  )
  async createPoll(
    @User() user: UserDto,
    @Body() createPollDto: CreatePollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const { picturesUrl, backgroundUrl } =
        this.filesService.getPictureUrlAndBackgroundUrl(
          images.pictures,
          images.background,
        );
      if (createPollDto.startDate === undefined) {
        createPollDto.status = PollStatus.ongoing;
        createPollDto.startDate = new Date();
      } else {
        createPollDto.status = PollStatus.pending;
      }

      const payload = await this.pollsService.createPoll(
        user,
        createPollDto,
        picturesUrl,
        backgroundUrl,
      );
      const payloadInvitation: MailInvitationVote = {
        pollId: payload.poll.id,
        token: payload.poll.token,
      };
      if (payload.poll.status === PollStatus.ongoing) {
        this.eventEmitter.emit(
          MailEvent.SEND_MAIL_INVITATION_VOTE,
          payloadInvitation,
        );
      }
      return payload;
    } catch (error) {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            if (picture === undefined) return;
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new HttpException(error.response, error.status);
    }
  }

  @Post('draft')
  @UseInterceptors(
    new UploadFilesErrorsInterceptor(),
    FileFieldsInterceptor(
      [
        { name: FieldName.PICTURES, maxCount: 10 },
        { name: FieldName.BACKGROUND, maxCount: 1 },
      ],
      FilesService.multerOptions({
        fileSize: 5,
        folder: 'images',
      }),
    ),
  )
  createDraftPoll(
    @User() user: UserDto,
    @Body() createDraftPollDto: CreateDraftPollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const { picturesUrl, backgroundUrl } =
        this.filesService.getPictureUrlAndBackgroundUrl(
          images.pictures,
          images.background,
        );
      createDraftPollDto.status = PollStatus.draft;

      return this.pollsService.createPoll(
        user,
        createDraftPollDto,
        picturesUrl,
        backgroundUrl,
      );
    } catch (error) {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            if (picture === undefined) return;
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new HttpException(error.response, error.status);
    }
  }

  @Post('participant-polls')
  getParticipantPolls(
    @User() user: UserDto,
    @Body() filterPollDto: FilterPollDto,
  ) {
    filterPollDto.where = {
      ...this.pollsService.filterParticipantPoll(user.id),
      ...filterPollDto.where,
    };
    return this.pollsService.getPollList(filterPollDto);
  }

  @Post('my-polls')
  getMyPolls(@User() user: UserDto, @Body() filterPollDto: FilterPollDto) {
    filterPollDto.where = {
      authorId: user.id,
      ...filterPollDto.where,
    };
    return this.pollsService.getPollList(filterPollDto);
  }

  @Get(':id')
  async getPollById(
    @User() user: UserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      return await this.pollsService.getPollById(user, id);
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
  }
}
