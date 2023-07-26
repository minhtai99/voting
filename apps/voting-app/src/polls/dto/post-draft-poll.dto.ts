import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateDraftPollDto } from './create-draft-poll.dto';

export class SaveDraftPollDto extends CreateDraftPollDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  backgroundUrl?: string;
}
