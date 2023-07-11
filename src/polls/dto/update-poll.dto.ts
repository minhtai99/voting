import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreatePollDto } from './create-poll.dto';

export class UpdatePollDto extends PartialType(CreatePollDto) {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  backgroundUrl?: string;
}
