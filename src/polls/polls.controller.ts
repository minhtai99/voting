import { InviteUsersDto } from './dto/invite-user.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { VoteGuard } from './../votes/vote.guard';
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
  Patch,
  Req,
  BadRequestException,
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
import {
  MSG_POLL_NOT_FOUND,
  MSG_POLL_STATUS_NOT_ONGOING,
  MSG_SAVE_DRAFT_SUCCESSFUL,
  MSG_SUCCESSFUL_POLL_CREATION,
} from '../constants/message.constant';
import { FilterPollDto } from './dto/filter-poll.dto';
import { PollStatus } from '@prisma/client';
import { CreatePollDto } from './dto/create-poll.dto';
import { UploadFilesErrorsInterceptor } from './interceptors/poll-errors.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PollAuthorGuard } from './poll-author.guard';
import { PollDto } from './dto/poll.dto';
import { UpdateDraftPollDto } from './dto/update-draft-poll.dto';

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

      const poll = await this.pollsService.createPoll(
        user,
        createPollDto,
        picturesUrl,
        backgroundUrl,
      );
      const payloadInvitation: MailInvitationVote = {
        pollId: poll.id,
      };
      if (poll.status === PollStatus.ongoing) {
        this.eventEmitter.emit(
          MailEvent.SEND_MAIL_INVITATION_VOTE,
          payloadInvitation,
        );
      }
      return {
        message: MSG_SUCCESSFUL_POLL_CREATION,
        poll,
      };
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
  async createDraftPoll(
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
      const poll = await this.pollsService.createPoll(
        user,
        createDraftPollDto,
        picturesUrl,
        backgroundUrl,
      );
      return {
        message: MSG_SAVE_DRAFT_SUCCESSFUL,
        poll,
      };
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

  @Get(':pollId')
  @UseGuards(VoteGuard)
  async getPollById(
    @User() user: UserDto,
    @Param('pollId', ParseIntPipe) pollId: number,
  ) {
    try {
      return await this.pollsService.getPollById(user, pollId);
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
  }

  @Patch('invite-people')
  @UseGuards(PollAuthorGuard)
  async updateInvitedUsers(@Req() req: Request, @Body() body: InviteUsersDto) {
    const poll: PollDto = req['poll'];
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_NOT_ONGOING);
    }
    return await this.pollsService.updateInvitePeople(poll, body.invitedUsers);
  }

  @Patch(':pollId/start-now')
  @UseGuards(PollAuthorGuard)
  async startPoll(@Req() req: Request) {
    const poll: PollDto = req['poll'];
    if (poll.status === PollStatus.ongoing) {
      throw new BadRequestException('Poll Status was Ongoing');
    }

    const updatePoll = await this.pollsService.updatePrismaPoll({
      where: { id: poll.id },
      data: { startDate: new Date(), status: PollStatus.ongoing },
    });
    await this.pollsService.sendPollEmail(updatePoll.poll);
    return updatePoll;
  }

  @Patch(':pollId/end-now')
  @UseGuards(PollAuthorGuard)
  async endPoll(@Req() req: Request) {
    const poll: PollDto = req['poll'];
    if (poll.status === PollStatus.completed) {
      throw new BadRequestException('Poll Status was Completed');
    }

    const updatePoll = await this.pollsService.updatePrismaPoll({
      where: { id: poll.id },
      data: { endDate: new Date(), status: PollStatus.completed },
    });
    await this.pollsService.sendPollEmail(updatePoll.poll);
    return updatePoll;
  }

  @Patch(':pollId/post')
  @UseGuards(PollAuthorGuard)
  @UseInterceptors(
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
  async postPoll(
    @Req() req: Request,
    @Body() updatePollDto: UpdatePollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const poll: PollDto = req['poll'];
      const { picturesUrl, backgroundUrl } =
        this.filesService.getPictureUrlAndBackgroundUrl(
          images.pictures,
          images.background,
        );
      if (updatePollDto.startDate === undefined) {
        updatePollDto.status = PollStatus.ongoing;
        updatePollDto.startDate = new Date();
      } else {
        updatePollDto.status = PollStatus.pending;
      }
      const updatePoll = await this.pollsService.updatePoll(
        poll,
        updatePollDto,
        picturesUrl,
        backgroundUrl,
      );
      return {
        message: MSG_SUCCESSFUL_POLL_CREATION,
        poll: updatePoll,
      };
    } catch (error) {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new HttpException(error.response, error.status);
    }
  }

  @Patch(':pollId/save-draft')
  @UseGuards(PollAuthorGuard)
  @UseInterceptors(
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
  async saveDraftPoll(
    @Req() req: Request,
    @Body() updatePollDto: UpdateDraftPollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const poll: PollDto = req['poll'];
      const { picturesUrl, backgroundUrl } =
        this.filesService.getPictureUrlAndBackgroundUrl(
          images.pictures,
          images.background,
        );
      updatePollDto.status = PollStatus.draft;

      const updatePoll = await this.pollsService.updatePoll(
        poll,
        updatePollDto,
        picturesUrl,
        backgroundUrl,
      );
      return {
        message: MSG_SAVE_DRAFT_SUCCESSFUL,
        poll: updatePoll,
      };
    } catch (error) {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new HttpException(error.response, error.status);
    }
  }
}
