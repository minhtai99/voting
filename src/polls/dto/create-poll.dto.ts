import { ApiProperty } from '@nestjs/swagger';
import { PollStatus, AnswerType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GreaterComparison } from 'src/decorators/greater-comparison.decorator';

export class CreatePollDto {
  @MaxLength(50)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @MaxLength(1000)
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  question: string;

  @IsEnum(AnswerType)
  @IsNotEmpty()
  @ApiProperty({ enum: AnswerType })
  answerType: AnswerType;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  backgroundUrl?: string;

  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty()
  startDate?: Date = new Date('2777-07-07T00:00:00');

  @GreaterComparison<CreatePollDto>('startDate')
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty()
  endDate: Date = new Date('2777-07-07T07:07:00');

  @IsBoolean()
  @Transform(({ value }) => value && Boolean(value))
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  isPublic?: boolean = false;

  @IsEnum(PollStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: PollStatus })
  status: PollStatus;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false })
  invitedUsers?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false })
  answerOptions?: string[];
}
