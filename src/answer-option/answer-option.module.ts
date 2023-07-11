import { Module } from '@nestjs/common';
import { AnswerOptionService } from './answer-option.service';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [FilesModule],
  providers: [AnswerOptionService],
  exports: [AnswerOptionService],
})
export class AnswerOptionModule {}
