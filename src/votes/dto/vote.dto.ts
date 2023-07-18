import { PollDto } from 'src/polls/dto/poll.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Vote } from '@prisma/client';
import { AnswerOptionDto } from '../../answer-option/dto/answer-option.dto';
import { UserDto } from '../../users/dto/user.dto';
import { Type } from 'class-transformer';

export class VoteDto implements Vote {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  input: string;

  @ApiProperty()
  pollId: number;

  @ApiProperty()
  answerOptionId: number;

  @ApiProperty()
  participantId: number;

  @ApiProperty({ type: AnswerOptionDto, isArray: true })
  @Type(() => AnswerOptionDto)
  answers: AnswerOptionDto[];

  @ApiProperty({ type: UserDto })
  @Type(() => UserDto)
  participant: UserDto;

  @ApiProperty()
  @Type(() => PollDto)
  poll: PollDto;
}
