import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreatePollDto } from './create-poll.dto';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDraftPollDto extends PartialType(
  OmitType(CreatePollDto, ['title', 'invitedUsers']),
) {
  @MaxLength(200)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsNumber({}, { each: true })
  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @IsOptional()
  @ApiProperty({ required: false, type: [Number] })
  invitedUsers?: number[] = [];
}
