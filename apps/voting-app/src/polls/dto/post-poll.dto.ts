import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreatePollDto } from './create-poll.dto';

export class PostPollDto extends CreatePollDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  backgroundUrl?: string;
}
