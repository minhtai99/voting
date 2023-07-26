import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostPollDto } from './post-poll.dto';

export class EditPollDto extends PartialType(
  OmitType(PostPollDto, ['invitedUsers']),
) {
  @IsNumber({}, { each: true })
  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @IsOptional()
  @ApiProperty({ required: false, type: [Number] })
  invitedUsers?: number[] = [];
}
