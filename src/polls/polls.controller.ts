import { InviteUsersDto } from './dto/invite-user.dto';
import { PostPollDto } from './dto/post-poll.dto';
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
import {
  MSG_POLL_NOT_FOUND,
  MSG_POLL_STATUS_MUST_ONGOING,
  MSG_POLL_STATUS_MUST_PENDING,
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
import { SaveDraftPollDto } from './dto/post-draft-poll.dto';
import { Request } from 'express';
import { EditPollDto } from './dto/edit-poll.dto';

@UseGuards(JwtAuthGuard)
@Controller('polls')
@ApiTags('polls')
export class PollsController {
  constructor(
    private readonly pollsService: PollsService,
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
      const { status, startDate } =
        this.pollsService.checkStartDateAndEndData(createPollDto);
      createPollDto.status = status;
      createPollDto.startDate = startDate;

      const poll = await this.pollsService.createPoll(
        user,
        createPollDto,
        images.pictures,
        images.background,
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
      this.pollsService.deleteFilesIfThereIsAnError(images);
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
      createDraftPollDto.status = PollStatus.draft;
      const poll = await this.pollsService.createPoll(
        user,
        createDraftPollDto,
        images.pictures,
        images.background,
      );
      return {
        message: MSG_SAVE_DRAFT_SUCCESSFUL,
        poll,
      };
    } catch (error) {
      this.pollsService.deleteFilesIfThereIsAnError(images);
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
  async getPollById(@Param('pollId', ParseIntPipe) pollId: number) {
    try {
      return await this.pollsService.getPollById(pollId);
    } catch {
      throw new NotFoundException(MSG_POLL_NOT_FOUND);
    }
  }

  @Patch('invite-people')
  @UseGuards(PollAuthorGuard)
  async updateInvitePeople(@Req() req: Request, @Body() body: InviteUsersDto) {
    const poll: PollDto = req['poll'];
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_MUST_ONGOING);
    }
    return await this.pollsService.updateInvitePeople(poll, body.invitedUsers);
  }

  @Patch(':pollId/start-now')
  @UseGuards(PollAuthorGuard)
  async startPoll(@Req() req: Request) {
    const poll: PollDto = req['poll'];
    if (poll.status !== PollStatus.pending) {
      throw new BadRequestException(MSG_POLL_STATUS_MUST_PENDING);
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
    if (poll.status !== PollStatus.ongoing) {
      throw new BadRequestException(MSG_POLL_STATUS_MUST_ONGOING);
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
    @Body() postPollDto: PostPollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const poll: PollDto = req['poll'];
      const { status, startDate } =
        this.pollsService.checkStartDateAndEndData(postPollDto);
      postPollDto.status = status;
      postPollDto.startDate = startDate;

      const updatePoll = await this.pollsService.updatePoll(
        poll,
        postPollDto,
        images.pictures,
        images.background,
      );
      return {
        message: MSG_SUCCESSFUL_POLL_CREATION,
        poll: updatePoll,
      };
    } catch (error) {
      this.pollsService.deleteFilesIfThereIsAnError(images);
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
    @Body() updatePollDto: SaveDraftPollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const poll: PollDto = req['poll'];
      updatePollDto.status = PollStatus.draft;

      const updatePoll = await this.pollsService.updatePoll(
        poll,
        updatePollDto,
        images.pictures,
        images.background,
      );
      return {
        message: MSG_SAVE_DRAFT_SUCCESSFUL,
        poll: updatePoll,
      };
    } catch (error) {
      this.pollsService.deleteFilesIfThereIsAnError(images);
      throw new HttpException(error.response, error.status);
    }
  }

  @Patch(':pollId/edit')
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
  async editPoll(
    @Req() req: Request,
    @Body() editPollDto: EditPollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const poll: PollDto = req['poll'];
      if (poll.status !== PollStatus.pending) {
        throw new BadRequestException(MSG_POLL_STATUS_MUST_PENDING);
      }

      this.pollsService.checkStartDateAndEndDate(poll, editPollDto);

      const updatePoll = await this.pollsService.updatePoll(
        poll,
        editPollDto,
        images.pictures,
        images.background,
      );
      return {
        message: MSG_SUCCESSFUL_POLL_CREATION,
        poll: updatePoll,
      };
    } catch (error) {
      this.pollsService.deleteFilesIfThereIsAnError(images);
      throw new HttpException(error.response, error.status);
    }
  }
}
