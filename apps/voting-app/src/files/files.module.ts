import { Module, forwardRef } from '@nestjs/common';
import { FilesService } from './files.service';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [forwardRef(() => PollsModule)],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
