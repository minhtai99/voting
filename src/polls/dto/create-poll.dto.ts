import { ApiProperty } from '@nestjs/swagger';
import { AnswerType, PollStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinDate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { GreaterComparison } from '../../decorators/greater-comparison.decorator';
import { RequestAnswerOption } from '../../answer-option/dto/request-answer-option.dto';

export class CreatePollDto {
  status: PollStatus;

  @MaxLength(200)
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

  @MinDate(new Date())
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @IsOptional()
  @ApiProperty({ required: false })
  startDate: Date;

  @GreaterComparison<CreatePollDto>('startDate')
  @MinDate(new Date())
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @ApiProperty()
  endDate: Date;

  @IsBoolean()
  @Transform(({ value }) => value && Boolean(value))
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  isPublic?: boolean = false;

  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @IsArray()
  @Transform((item) => item.value.map((v) => Number(v)))
  @ValidateIf((e) => e.isPublic === false)
  @ApiProperty({ required: false, type: [Number] })
  invitedUsers: number[];

  @ArrayMaxSize(10)
  @IsArray()
  @Type(() => RequestAnswerOption)
  @ValidateNested({ each: true })
  @Transform((item) => item.value && Object(item.value))
  @IsOptional()
  @ApiProperty({ required: false, type: [RequestAnswerOption] })
  answerOptions?: RequestAnswerOption[] = [];
}
