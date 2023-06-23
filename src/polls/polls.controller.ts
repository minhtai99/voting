import {
  Controller,
  UseGuards,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateDraftPollDto } from './dto/create-draft-poll.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { User } from 'src/decorators/user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { FieldName } from 'src/files/files.enum';
import * as fs from 'fs';
import { MSG_FILE_UPLOAD_FAILED } from 'src/constants/message.constant';
import { FilterPollDto } from './dto/filter-poll.dto';
import { PollStatus } from '@prisma/client';
import { CreatePollDto } from './dto/create-poll.dto';

@UseGuards(JwtAuthGuard)
@Controller('polls')
@ApiTags('polls')
export class PollsController {
  constructor(
    private readonly pollsService: PollsService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
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
  createPoll(
    @User() user: UserDto,
    @Body() createPollDto: CreatePollDto,
    @UploadedFiles()
    images: {
      pictures?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    try {
      const filesUrl = this.filesService.getPictureUrlAndBackgroundUrl(
        images.pictures,
        images.background,
      );
      if (createPollDto.startDate === undefined) {
        createPollDto.status = PollStatus.ongoing;
      } else {
        createPollDto.status = PollStatus.pending;
      }

      return this.pollsService.createPoll(
        user,
        createPollDto,
        filesUrl.picturesUrl,
        filesUrl.backgroundUrl,
      );
    } catch {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            if (picture === undefined) return;
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new InternalServerErrorException(MSG_FILE_UPLOAD_FAILED);
    }
  }

  @Post('draft')
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
    } catch {
      if (images !== undefined) {
        if (images.background !== undefined)
          fs.unlink(images.background[0].path, (err) => err);
        if (images.pictures !== undefined)
          images.pictures.forEach((picture) => {
            if (picture === undefined) return;
            fs.unlink(picture.path, (err) => err);
          });
      }
      throw new InternalServerErrorException(MSG_FILE_UPLOAD_FAILED);
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
}
