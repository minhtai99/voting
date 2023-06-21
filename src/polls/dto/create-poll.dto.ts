import { ApiProperty } from '@nestjs/swagger';
import { AnswerType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinDate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { GreaterComparison } from 'src/decorators/greater-comparison.decorator';
import { StatusCreatePoll } from '../polls.enum';
import { RequestAnswerOption } from 'src/answer-option/dto/request-answer-option.dto';

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

  @IsDate()
  @MinDate(new Date())
  @Transform(({ value }) => value && new Date(value))
  @IsNotEmpty()
  @ValidateIf((e) => e.status === StatusCreatePoll.Pending)
  @ApiProperty()
  startDate: Date;

  @GreaterComparison<CreatePollDto>('startDate')
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @ValidateIf((e) => e.status === StatusCreatePoll.Pending)
  @ApiProperty()
  endDate: Date;

  @IsBoolean()
  @Transform(({ value }) => value && Boolean(value))
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  isPublic?: boolean = false;

  @IsEnum(StatusCreatePoll)
  @IsNotEmpty()
  @ApiProperty({ enum: StatusCreatePoll })
  status: StatusCreatePoll;

  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @IsOptional()
  @ApiProperty({ required: false, type: [Number] })
  invitedUsers?: number[];

  @IsArray()
  @Type(() => RequestAnswerOption)
  @ValidateNested({ each: true })
  @Transform((item) => item.value && Object(item.value))
  @IsOptional()
  @ApiProperty({ required: false, type: [RequestAnswerOption] })
  answerOptions?: RequestAnswerOption[];
}
