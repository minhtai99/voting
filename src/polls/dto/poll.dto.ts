import { ApiProperty } from '@nestjs/swagger';
import { Poll, PollStatus, AnswerType } from '@prisma/client';
import { AnswerOptionDto } from 'src/answer-option/dto/answer-option.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { VoteDto } from 'src/votes/dto/vote.dto';

export class PollDto implements Poll {
  constructor({ author, invitedUsers, ...data }: Partial<PollDto>) {
    Object.assign(this, data);

    if (author) {
      this.author = new UserDto(author);
    }
    if (invitedUsers) {
      this.invitedUsers = invitedUsers.map(
        (invitedUser) => new UserDto(invitedUser),
      );
    }
  }

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

  @ApiProperty()
  authorId: number;

  @ApiProperty({ isArray: true, type: UserDto })
  invitedUsers?: UserDto[];

  @ApiProperty({ isArray: true, type: AnswerOptionDto })
  answerOptions?: AnswerOptionDto[];

  @ApiProperty({ isArray: true, type: VoteDto })
  votes: VoteDto[];

  @ApiProperty({ type: UserDto })
  author: UserDto;
}
