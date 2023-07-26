import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreatePollDto } from './create-poll.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class InviteUsersDto extends PickType(CreatePollDto, [
  'invitedUsers',
  'groupList',
]) {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  @ApiProperty()
  pollId: number;
}
