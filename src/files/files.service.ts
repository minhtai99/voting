import { PollsService } from './../polls/polls.service';
import {
  SummaryVoteExcel,
  VoteExcel,
} from './../mails/interfaces/send-mail.interface';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import {
  BadRequestException,
  Injectable,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { fileConfig, fileFilter } from '../helpers/files.helper';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as excelJs from 'exceljs';
import * as fs from 'fs';
import { AnswerType } from '@prisma/client';
import path from 'path';

interface UploadFile {
  fileSize: number;
  folder: string;
}

@Injectable()
export class FilesService {
  constructor(
    @Inject(forwardRef(() => PollsService))
    private readonly pollsService: PollsService,
  ) {}
  private readonly logger = new Logger(FilesService.name);

  static multerOptions(file: UploadFile): MulterOptions {
    return {
      limits: FilesService.configLimits(file.fileSize),
      fileFilter: FilesService.configFileFilter,
      storage: FilesService.configDiskStorage(file.folder),
    };
  }

  static configLimits(fileSize: number) {
    return {
      fileSize: +(fileSize * 1024 * 1024), // mb style size
    };
  }

  static configFileFilter(req: any, file: any, cb: any) {
    if (fileFilter(file.fieldname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(`Unsupported file type ${file.mimetype}`),
        false,
      );
    }
  }

  static configDiskStorage(folder: string) {
    const destination = `${fileConfig.dest}/${folder}`;

    return diskStorage({
      destination: (req: any, file: any, cb: any) => {
        const uploadPath = destination;
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req: any, file: any, cb: any) => {
        const originalname = file.originalname.replace(/\s+/g, '');
        cb(null, `${uuid()}-${originalname}`);
      },
    });
  }

  deleteFile(url: string, folder?: string) {
    if (url === null) return;
    if (folder !== undefined) {
      fs.unlink(
        `${fileConfig.dest}/${url.slice(url.indexOf(folder))}`,
        (err) => err,
      );
    } else {
      fs.unlink(`./dist/${url}`, (err) => err);
    }
  }

  getPictureUrlAndBackgroundUrl(
    pictures: Express.Multer.File[],
    background: Express.Multer.File[],
  ) {
    let picturesUrl = [];
    let backgroundUrl = null;
    if (pictures !== undefined) {
      picturesUrl = pictures.map((picture) => {
        if (picture === undefined) return null;
        return (
          fileConfig.domain + picture.path.slice(picture.path.indexOf('images'))
        );
      });
    }
    if (background !== undefined) {
      backgroundUrl =
        fileConfig.domain +
        background[0].path.slice(background[0].path.indexOf('images'));
    }
    return {
      picturesUrl,
      backgroundUrl,
    };
  }

  async convertJsonToExcel(sheetName: string, sheetData: any[]) {
    try {
      const filename = `${sheetName}.xlsx`;
      const workbook = new excelJs.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = [
        {
          key: 'no',
          width: 20,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'center',
            },
          },
        },
        {
          key: 'email',
          width: 25,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'middle',
            },
          },
        },
        {
          key: 'name',
          width: 25,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'middle',
            },
          },
        },
        {
          key: 'time',
          width: 25,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'middle',
            },
          },
        },
        {
          key: 'answer',
          width: 80,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'middle',
            },
          },
        },
      ];
      worksheet.getCell(1, 1).font = {
        bold: true,
        size: 13,
      };
      worksheet.getCell(1, 1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getCell(1, 1).border = {
        top: { style: 'medium', color: { argb: 'FF3F3F' } },
        left: { style: 'medium', color: { argb: 'FF3F3F' } },
        bottom: { style: 'medium', color: { argb: 'FF3F3F' } },
        right: { style: 'medium', color: { argb: 'FF3F3F' } },
      };
      for (let i = 1; i <= 5; i++) {
        worksheet.getCell(7, i).font = {
          bold: true,
          size: 13,
        };
        worksheet.getCell(7, i).alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
        worksheet.getCell(7, i).border = {
          top: { style: 'medium', color: { argb: '196F3D' } },
          left: { style: 'medium', color: { argb: '196F3D' } },
          bottom: { style: 'medium', color: { argb: '196F3D' } },
          right: { style: 'medium', color: { argb: '196F3D' } },
        };
      }

      worksheet.getColumn(1).header = [
        'Summary',
        'Title',
        'Question',
        'Start Time',
        'End Time',
        'Answer Type',
        'No.',
      ];
      worksheet.getColumn(2).header = [
        '',
        sheetData[0].title,
        sheetData[0].question,
        sheetData[0].startTime,
        sheetData[0].endTime,
        sheetData[0].answerType,
        'Email',
      ];
      worksheet.getColumn(3).header = ['', '', '', '', '', '', 'Name'];
      worksheet.getColumn(4).header = ['', '', '', '', '', '', 'Time'];
      worksheet.getColumn(5).header = ['', '', '', '', '', '', 'Answer'];

      worksheet.mergeCells('A1:E1');
      for (let i = 2; i <= 6; i++) {
        worksheet.mergeCells(`B${i}:E${i}`);
        worksheet.getCell(i, 1).font = {
          bold: true,
          size: 12,
        };
        worksheet.getCell(i, 1).border = {
          right: { style: 'medium', color: { argb: 'FF1F00' } },
        };
      }

      sheetData.map((value, index) => {
        if (index === 0) return;
        worksheet.addRow({
          no: index,
          email: value.email,
          name: value.name,
          time: value.time,
          answer: value.answer,
        });
      });

      const data = await workbook.xlsx.writeBuffer();
      return { filename, data };
    } catch (error) {
      this.logger.error('Failed to prepare Report Data: ' + error);
    }
  }

  async exportDataToBuffer(pollId: number) {
    const poll = await this.pollsService.findPollById(pollId);
    const jsonVotes: (VoteExcel | SummaryVoteExcel)[] = [];
    jsonVotes.push({
      title: poll.title,
      question: poll.question,
      startTime: poll.startDate.toLocaleString(),
      endTime: poll.endDate.toLocaleString(),
      answerType: poll.answerType,
    });
    if (poll.answerType === AnswerType.checkbox) {
      poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.updatedAt.toLocaleString(),
          answer: vote.answers
            .map((answer, index) => `${index + 1}. ${answer.content}`)
            .toString()
            .replace(/,+/g, '\n'),
        });
      });
    } else {
      poll.votes.map((vote) => {
        jsonVotes.push({
          email: vote.participant.email,
          name: vote.participant.firstName + ' ' + vote.participant.lastName,
          time: vote.updatedAt.toLocaleString(),
          answer:
            poll.answerType === AnswerType.input
              ? vote.input
              : vote.answers[0].content,
        });
      });
    }
    return await this.convertJsonToExcel(`${poll.id}_poll_result`, jsonVotes);
  }

  async exportDataToFile(pollId: number) {
    const excelFile = await this.exportDataToBuffer(pollId);
    fs.writeFileSync(
      path.join(__dirname, '../../', excelFile.filename),
      Buffer.from(excelFile.data),
    );
    return excelFile.filename;
  }
}
