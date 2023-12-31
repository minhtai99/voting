import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { AnswerOptionDto } from './dto/answer-option.dto';

@Injectable()
export class AnswerOptionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
  ) {}

  async deleteManyAnswerOption(arrayId: number[]) {
    await this.prisma.answerOption.deleteMany({
      where: {
        id: {
          in: arrayId,
        },
      },
    });
  }

  async deletePictures(arrayId: number[]) {
    for await (const id of arrayId) {
      const answerOption = await this.prisma.answerOption.findUnique({
        where: { id },
      });
      if (answerOption.pictureUrl)
        this.filesService.deleteFile(answerOption.pictureUrl, 'images');
      await this.prisma.answerOption.update({
        where: { id },
        data: { pictureUrl: null },
      });
    }
  }

  async updateAnswerOption(data: Partial<AnswerOptionDto>) {
    return await this.prisma.answerOption.update({
      where: { id: data.id },
      data: {
        content: data.content,
        pictureUrl: data?.pictureUrl,
      },
    });
  }
}
