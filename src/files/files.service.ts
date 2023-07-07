import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { fileConfig, fileFilter } from '../helpers/files.helper';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as excelJs from 'exceljs';

interface UploadFile {
  fileSize: number;
  folder: string;
}

@Injectable()
export class FilesService {
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
        top: { style: 'thick', color: { argb: 'FF1F00' } },
        left: { style: 'thick', color: { argb: 'FF1F00' } },
        bottom: { style: 'thick', color: { argb: 'FF1F00' } },
        right: { style: 'thick', color: { argb: 'FF1F00' } },
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
          top: { style: 'double', color: { argb: '196F3D' } },
          left: { style: 'double', color: { argb: '196F3D' } },
          bottom: { style: 'double', color: { argb: '196F3D' } },
          right: { style: 'double', color: { argb: '196F3D' } },
        };
      }

      const col1 = worksheet.getColumn(1);
      const col2 = worksheet.getColumn(2);
      col1.header = [
        'Summary',
        'Title',
        'Question',
        'Start Time',
        'End Time',
        'Answer Type',
        'No.',
      ];
      col2.header = [
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

      sheetData.map((value, index) => {
        if (value.title) return;
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
}
