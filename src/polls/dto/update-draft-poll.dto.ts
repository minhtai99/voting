import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UpdatePollDto } from './update-poll.dto';

export class UpdateDraftPollDto extends PartialType(
  OmitType(UpdatePollDto, ['title', 'invitedUsers']),
) {
  @MaxLength(200)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @IsOptional()
  @ApiProperty({ required: false, type: [Number] })
  invitedUsers?: number[] = [];
}
