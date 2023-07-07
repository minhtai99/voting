import { ApiProperty } from '@nestjs/swagger';
import { Poll, Vote } from '@prisma/client';
import { AnswerOptionDto } from '../../answer-option/dto/answer-option.dto';
import { UserDto } from '../../users/dto/user.dto';
import { PollDto } from 'src/polls/dto/poll.dto';

export class VoteDto implements Vote {
  constructor({ participant, poll, ...data }: Partial<VoteDto>) {
    Object.assign(this, data);

    if (participant) {
      this.participant = new UserDto(participant);
    }
    if (poll) {
      this.poll = new PollDto(poll);
    }
  }

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
  answers: AnswerOptionDto[];

  @ApiProperty({ type: UserDto })
  participant: UserDto;

  @ApiProperty()
  poll: Poll;
}
