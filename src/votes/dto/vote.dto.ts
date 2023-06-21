import { ApiProperty } from '@nestjs/swagger';
import { Vote } from '@prisma/client';
import { AnswerOptionDto } from 'src/answer-option/dto/answer-option.dto';
import { UserDto } from 'src/users/dto/user.dto';

export class VoteDto implements Vote {
  constructor({ participant, ...data }: Partial<VoteDto>) {
    Object.assign(this, data);

    if (participant) {
      this.participant = new UserDto(participant);
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

  @ApiProperty({ type: AnswerOptionDto })
  answerOption: AnswerOptionDto;

  @ApiProperty({ type: UserDto })
  participant: UserDto;
}
