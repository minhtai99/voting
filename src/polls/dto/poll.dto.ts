import { ApiProperty } from '@nestjs/swagger';
import { Poll, PollStatus, AnswerType } from '@prisma/client';
import { AnswerOptionDto } from '../../answer-option/dto/answer-option.dto';
import { UserDto } from '../../users/dto/user.dto';
import { Exclude, Type } from 'class-transformer';
import { VoteDto } from 'src/votes/dto/vote.dto';

export class PollDto implements Poll {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  title: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answerType: AnswerType;

  @ApiProperty()
  backgroundUrl: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  status: PollStatus;

  @Exclude()
  token: string;

  @ApiProperty()
  authorId: number;

  @ApiProperty({ isArray: true, type: AnswerOptionDto })
  @Type(() => AnswerOptionDto)
  answer?: AnswerOptionDto[];

  @ApiProperty({ isArray: true, type: UserDto })
  @Type(() => UserDto)
  invitedUsers?: UserDto[];

  @ApiProperty({ isArray: true, type: AnswerOptionDto })
  @Type(() => AnswerOptionDto)
  answerOptions?: AnswerOptionDto[];

  @ApiProperty({ type: UserDto })
  @Type(() => UserDto)
  author: UserDto;

  @ApiProperty({ type: VoteDto })
  @Type(() => VoteDto)
  votes: VoteDto[];
}
