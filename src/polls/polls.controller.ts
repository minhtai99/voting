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
import { CreatePollDto } from './dto/create-poll.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { User } from 'src/decorators/user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { FieldName } from 'src/files/files.enum';
import * as fs from 'fs';
import { MSG_FILE_UPLOAD_FAILED } from 'src/constants/message.constant';
import { FilterPollDto } from './dto/filter-poll.dto';

@UseGuards(JwtAuthGuard)
@Controller('polls')
@ApiTags('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

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
      let picturesUrl = [];
      let backgroundUrl = null;
      if (images.pictures !== undefined) {
        picturesUrl = images.pictures.map((picture) => {
          if (picture === undefined) return null;
          return picture.path.slice(picture.path.indexOf('images'));
        });
      }
      if (images.background !== undefined) {
        backgroundUrl = images.background[0].path.slice(
          images.background[0].path.indexOf('images'),
        );
      }

      return this.pollsService.createPoll(
        user,
        createPollDto,
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
      OR: [
        {
          invitedUsers: {
            some: {
              id: user.id,
            },
          },
        },
        {
          votes: {
            some: {
              participantId: user.id,
            },
          },
        },
      ],
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
