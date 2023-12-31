import { Module, forwardRef } from '@nestjs/common';
import { AnswerOptionService } from './answer-option.service';
import { FilesModule } from './../files/files.module';

@Module({
  imports: [forwardRef(() => FilesModule)],
  providers: [AnswerOptionService],
  exports: [AnswerOptionService],
})
export class AnswerOptionModule {}
