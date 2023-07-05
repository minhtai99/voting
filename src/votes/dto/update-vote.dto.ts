import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateVoteDto } from './create-vote.dto';

export class UpdateVoteDto extends PartialType(
  OmitType(CreateVoteDto, ['pollId']),
) {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  voteId: number;
}
