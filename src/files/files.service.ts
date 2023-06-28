import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { fileFilter, multerConfig } from '../helpers/files.helper';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

interface UploadFile {
  fileSize: number;
  folder: string;
}

@Injectable()
export class FilesService {
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
    const destination = `${multerConfig.dest}/${folder}`;

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
        return picture.path.slice(picture.path.indexOf('images'));
      });
    }
    if (background !== undefined) {
      backgroundUrl = background[0].path.slice(
        background[0].path.indexOf('images'),
      );
    }
    return {
      picturesUrl,
      backgroundUrl,
    };
  }
}
