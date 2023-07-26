import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { PollDto } from './../../polls/dto/poll.dto';
import { VoteDto } from './../../votes/dto/vote.dto';

export class UserDto implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  avatarUrl: string;

  @Exclude()
  refreshTokenHash: string;

  @Exclude()
  resetPasswordHash: string;

  @ApiProperty({ type: VoteDto })
  @Type(() => PollDto)
  invitedPolls: PollDto[];

  @ApiProperty({ type: VoteDto })
  @Type(() => PollDto)
  createdPolls: PollDto[];

  @ApiProperty({ type: VoteDto })
  @Type(() => VoteDto)
  createdVotes: VoteDto[];
}
