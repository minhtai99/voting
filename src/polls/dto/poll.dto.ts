import { ApiProperty } from '@nestjs/swagger';
import { Poll, PollStatus, AnswerType, Vote } from '@prisma/client';
import { AnswerOptionDto } from '../../answer-option/dto/answer-option.dto';
import { UserDto } from '../../users/dto/user.dto';
import { Exclude } from 'class-transformer';
import { VoteDto } from 'src/votes/dto/vote.dto';

export class PollDto implements Poll {
  constructor({ author, invitedUsers, votes, ...data }: Partial<PollDto>) {
    Object.assign(this, data);

    if (author) {
      this.author = new UserDto(author);
    }
    if (invitedUsers) {
      this.invitedUsers = invitedUsers.map(
        (invitedUser) => new UserDto(invitedUser),
      );
    }
    if (votes) {
      this.votes = votes.map((vote) => new VoteDto(vote));
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

  @Exclude()
  token: string;

  @ApiProperty()
  authorId: number;

  @ApiProperty({ isArray: true, type: AnswerOptionDto })
  answer?: AnswerOptionDto[];

  @ApiProperty({ isArray: true, type: UserDto })
  invitedUsers?: UserDto[];

  @ApiProperty({ isArray: true, type: AnswerOptionDto })
  answerOptions?: AnswerOptionDto[];

  @ApiProperty({ type: UserDto })
  author: UserDto;

  @ApiProperty({ type: VoteDto })
  votes: Vote[];
}
